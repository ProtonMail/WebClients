import { LumoApiClient } from '@proton/lumo-api-client/core/client';
import { createSystemTurn, createUserTurn } from '@proton/lumo-api-client/utils';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { ENABLE_U2L_ENCRYPTION } from '../../llm/config';
import {
    SKILL_DESCRIPTION_MAX_LENGTH,
    SKILL_NAME_MAX_LENGTH,
    buildSkillMarkdown,
    parseSkillMarkdown,
} from './skillMarkdown';

export type GeneratedSkill = {
    name: string;
    description: string;
    instructions: string;
};

const SYSTEM_PROMPT = `You write skills for Lumo, Proton's AI assistant. A skill is a SKILL.md file: reusable instructions Lumo loads when a request matches the skill's description.

Reply with the complete SKILL.md file and nothing else: no code fences, no preamble, no closing remarks. Use this exact layout:

---
name: <short title, at most ${SKILL_NAME_MAX_LENGTH} characters, e.g. Weekly status report>
description: <one or two sentences, at most ${SKILL_DESCRIPTION_MAX_LENGTH} characters, saying what the skill does and when to use it, e.g. "Use when asked for…">
---

<instructions in Markdown>

Rules for the instructions:
- Address Lumo directly in the imperative ("Ask for…", "Write…").
- Start with the goal, then the steps, then the expected output format. Use headings and lists only where they help.
- Include the inputs Lumo should ask for when they are missing, and any tone, length or format constraints.
- Be specific and concise. Do not invent tools, files or connectors the user did not mention.
- Write the name, description and instructions in the language of the user's request.
- Keep YAML values on one line; wrap a value in double quotes when it contains a colon.`;

const buildUserPrompt = (request: string, current?: GeneratedSkill): string => {
    if (!current) {
        return `Create a skill for this request:\n\n${request.trim()}`;
    }
    return `Here is the current SKILL.md:\n\n${buildSkillMarkdown(current)}\nRevise it for this request and return the full updated file:\n\n${request.trim()}`;
};

const OPENING_FENCE = /^\s*```[\w-]*[ \t]*\r?\n/;
const CLOSING_FENCE = /\r?\n?`{1,3}\s*$/;
const DELIMITER = '---';

const stripPartialQuote = (value: string | undefined) => value?.replace(/^["']/, '') ?? '';

/**
 * Reads the SKILL.md written by Lumo, even while it is still streaming: an unclosed frontmatter
 * yields the name and description written so far and no instructions yet.
 */
export const parseGeneratedSkill = (raw: string): GeneratedSkill => {
    const text = raw.replace(OPENING_FENCE, '').replace(CLOSING_FENCE, '').trimStart();

    if (DELIMITER.startsWith(text)) {
        return { name: '', description: '', instructions: '' };
    }
    if (!text.startsWith(DELIMITER)) {
        return { name: '', description: '', instructions: text.trim() };
    }

    const closed = parseSkillMarkdown(text);
    const isClosed = closed.body !== text.trim();
    const { frontmatter, body } = isClosed ? closed : parseSkillMarkdown(`${text}\n${DELIMITER}\n`);
    const name = isClosed ? (frontmatter.name ?? '') : stripPartialQuote(frontmatter.name);
    const description = isClosed ? (frontmatter.description ?? '') : stripPartialQuote(frontmatter.description);

    return {
        name: name.slice(0, SKILL_NAME_MAX_LENGTH),
        description: description.slice(0, SKILL_DESCRIPTION_MAX_LENGTH),
        instructions: isClosed ? body : '',
    };
};

type GenerateSkillOptions = {
    /** The skill being revised; omitted to write a new one. */
    current?: GeneratedSkill;
    signal?: AbortSignal;
    onUpdate?: (skill: GeneratedSkill) => void;
};

/** Asks Lumo to write or revise a skill in a one-off request that is not saved as a conversation. */
export const generateSkill = async (
    api: Api,
    request: string,
    { current, signal, onUpdate }: GenerateSkillOptions = {}
): Promise<GeneratedSkill> => {
    const client = new LumoApiClient({ enableU2LEncryption: ENABLE_U2L_ENCRYPTION });
    let accumulated = '';

    const { status } = await client.callAssistant(
        api,
        [createSystemTurn(SYSTEM_PROMPT), createUserTurn(buildUserPrompt(request, current))],
        {
            signal,
            enableExternalTools: false,
            enableImageTools: false,
            chunkCallback: async (message) => {
                switch (message.type) {
                    case 'error':
                    case 'timeout':
                    case 'rejected':
                    case 'harmful':
                        throw new Error(`skill_generation_${message.type}`);
                    case 'token_data':
                        if (message.target === 'message') {
                            accumulated += message.content;
                            onUpdate?.(parseGeneratedSkill(accumulated));
                        }
                }
            },
        }
    );

    const skill = parseGeneratedSkill(accumulated);
    if (status === 'failed' || !skill.instructions) {
        throw new Error('skill_generation_failed');
    }
    return skill;
};

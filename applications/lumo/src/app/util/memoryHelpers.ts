import { getMessageContent } from '../messageHelpers';
import type { Memory, MemorySource } from '../redux/slices/lumoUserSettings';
import type { Conversation, Message, Space } from '../types';
import { Role } from '../types';
import { listify } from './collections';
import { sortByDate } from './date';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum user prompts sent to the model for generation. */
export const MEMORY_GENERATION_MAX_SAMPLES = 100;

/** Per-prompt character cap to limit payload size. */
export const MEMORY_GENERATION_MAX_CHARS_PER_SAMPLE = 512;

/** Minimum prompt length to be considered useful for sampling. */
export const MEMORY_GENERATION_MIN_PROMPT_LENGTH = 32;

/** Hard cap on memories the model may return per operation. */
export const MEMORY_GENERATION_MAX_MEMORIES = 50;

/** Soft target the model is steered toward for generate/refresh. */
export const MEMORY_GENERATION_TARGET_COUNT = 12;

/** Maximum length of a single saved memory. */
export const MEMORY_MAX_CONTENT_LENGTH = 256;

/** Minimum length for a stored memory string. */
export const MEMORY_MIN_CONTENT_LENGTH = 8;

/** General-chat user prompts before a background memory update runs. */
export const MEMORY_AUTO_SAVE_PROMPT_THRESHOLD = 10;

const MIN_SAMPLES_TO_GENERATE = 2;

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

const truncateText = (text: string, maxChars: number) => {
    const normalized = normalizeText(text);
    return normalized.length <= maxChars ? normalized : `${normalized.slice(0, maxChars - 1)}…`;
};

const normalizeMemoryContent = (content: string) => normalizeText(content).slice(0, MEMORY_MAX_CONTENT_LENGTH);

// ---------------------------------------------------------------------------
// Memory source helpers
// ---------------------------------------------------------------------------

export const getMemorySource = (memory: Memory): MemorySource => memory.source ?? 'user';

export const isUserMemory = (memory: Memory) => getMemorySource(memory) === 'user';

export const isGeneratedMemory = (memory: Memory) => getMemorySource(memory) === 'generated';

export const normalizeMemories = (memories: Memory[] | undefined): Memory[] =>
    (memories ?? []).map((memory) => ({ ...memory, source: getMemorySource(memory) }));

export const partitionMemories = (memories: Memory[]) => {
    const normalized = normalizeMemories(memories);
    return {
        user: normalized.filter(isUserMemory),
        generated: normalized.filter(isGeneratedMemory),
    };
};

// ---------------------------------------------------------------------------
// Memory factories
// ---------------------------------------------------------------------------

export const createMemory = (content: string, source: MemorySource): Memory => ({
    id: crypto.randomUUID(),
    content: normalizeMemoryContent(content),
    createdAt: Date.now(),
    source,
});

export const memoriesFromContents = (contents: string[], source: MemorySource): Memory[] => {
    const now = Date.now();
    return contents.map((content, index) => ({
        ...createMemory(content, source),
        createdAt: now - index,
    }));
};

export const sortMemoriesByDate = (memories: Memory[]) =>
    [...memories].toSorted((a, b) => b.createdAt - a.createdAt);

/**
 * Applies an edited content string to an existing memory.
 * Editing always promotes ownership to the user — otherwise a subsequent
 * "update from chats" could silently overwrite a user-authored change.
 */
export const applyMemoryEdit = (memory: Memory, nextContent: string): Memory => ({
    ...memory,
    content: normalizeMemoryContent(nextContent),
    source: 'user',
});

// ---------------------------------------------------------------------------
// Chat sampling
// ---------------------------------------------------------------------------

const isGeneralConversation = (conversation: Conversation, spaces: Record<string, Space>) => {
    if (!conversation.spaceId) {
        return true;
    }
    return spaces[conversation.spaceId]?.isProject !== true;
};

/** Collects a small, privacy-conscious sample of recent user prompts from general (non-project) chats. */
export const sampleUserPromptsForMemoryGeneration = (
    messages: Record<string, Message>,
    conversations: Record<string, Conversation>,
    spaces: Record<string, Space>
): string[] => {
    const generalConversationIds = new Set(
        listify(conversations)
            .filter((conversation) => isGeneralConversation(conversation, spaces))
            .map((conversation) => conversation.id)
    );

    const candidates = listify(messages)
        .filter(
            (message) =>
                message.role === Role.User &&
                generalConversationIds.has(message.conversationId) &&
                message.status !== 'failed'
        )
        .toSorted(sortByDate('desc'))
        .map((message) => truncateText(getMessageContent(message), MEMORY_GENERATION_MAX_CHARS_PER_SAMPLE))
        .filter((content) => content.length >= MEMORY_GENERATION_MIN_PROMPT_LENGTH);

    const seen = new Set<string>();
    const samples: string[] = [];

    for (const content of candidates) {
        const key = content.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        samples.push(content);
        if (samples.length >= MEMORY_GENERATION_MAX_SAMPLES) {
            break;
        }
    }

    return samples;
};

export const canGenerateMemoriesFromChats = (sampleCount: number) => sampleCount >= MIN_SAMPLES_TO_GENERATE;

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

const SHARED_MEMORY_QUALITY_RULES = `Read prompts as a CORPUS, not in isolation. Most individual prompts are one-off questions, but the *patterns across them* — recurring languages, tools, domains, tone, level of detail expected — are exactly the durable signal you should capture. Infer the underlying user from the aggregate.

Categories to capture (extract whichever clearly apply):
- Communication style: preferred tone, format (bullets, prose, code blocks), reply length, language
- Expertise & role: profession, seniority, technical fluency, domains the user works in
- Recurring tools, frameworks, languages, libraries, or stacks the user works with
- Stable goals and projects: long-running initiatives, side projects, study tracks, products being built
- Constraints: accessibility needs, time zone, working language, things to avoid
- Personal context that recurs: location/region, dietary or health preferences they explicitly share, names of pets/family they reference

Avoid:
- Memories tied to "today/this/yesterday" — transient state, not preferences
- Restatements of well-known facts unrelated to the user
- Vague platitudes ("user is curious", "asks good questions")
- Sensitive identifiers: passwords, tokens, API keys, government IDs, addresses, phone numbers, full names of third parties

Examples of GOOD memories:
- "Prefers concise, bullet-point answers with code examples"
- "Senior backend engineer working primarily in Go and PostgreSQL"
- "Frequently asks about React, TypeScript, and frontend tooling" (derived from many one-off questions)
- "Lives in Berlin, prefers metric units and DD/MM/YYYY dates"
- "Writing a thesis on distributed consensus algorithms"

Examples of BAD memories (do NOT emit):
- "User asked how to deduplicate an array in Python" (single task, not a pattern)
- "User is debugging a memory leak" (transient state)
- "User likes learning new things" (vague platitude)
- "User's email is foo@example.com" (sensitive identifier)

Output rules:
- Each memory is a single, atomic fact, preference, or piece of context
- Merge related observations into ONE memory; do not emit overlapping or paraphrased entries
- Aim for ~${MEMORY_GENERATION_TARGET_COUNT} memories (hard cap ${MEMORY_GENERATION_MAX_MEMORIES}); fewer high-signal beats many redundant
- Each string ≤ ${MEMORY_MAX_CONTENT_LENGTH} chars and self-contained (readable without the original prompt)
- Write in third person implicitly ("Prefers X", not "I prefer X" or "The user prefers X")
- Reply with ONLY a JSON array of strings (no markdown fences, no commentary, no surrounding text)`;

const numberedList = (items: string[]) => items.map((item, index) => `${index + 1}. ${item}`).join('\n');

export const buildMemoryBootstrapPrompt = (samples: string[], existingMemories: Memory[] = []): string => {
    const isFreshBootstrap = existingMemories.length === 0;

    const intro = isFreshBootstrap
        ? `You bootstrap long-term memories for an AI assistant from scratch.

Your job is to read the user's past chat prompts as a CORPUS and produce a consolidated set of durable memories that will personalize all future general chats. The list you return will be saved directly without further cleanup, so it must already be deduplicated and consolidated.

Returning very few memories (or none) here would mean future replies are NOT personalized — that is the worst outcome. With more than a handful of prompts, there are almost always durable signals (preferred languages, tools, communication style, domains of work) that can be inferred from the AGGREGATE, even when each individual prompt is a one-off question. Look for those patterns and extract them. Aim for ~${MEMORY_GENERATION_TARGET_COUNT} memories where possible.`
        : `You incrementally update long-term memories for an AI assistant.

The user already has these memories saved (do NOT repeat or paraphrase them — only return ADDITIONAL information not already covered):
${numberedList(existingMemories.map((m) => m.content))}

From the user's chat prompts below, extract any additional durable facts, preferences, or context that are NOT already covered by the existing memories above. The list you return will be appended to the existing memories without further cleanup, so it must already be deduplicated and consolidated.`;

    const trailingRules = isFreshBootstrap
        ? '- Return [] ONLY if the samples truly contain no durable signal whatsoever (e.g. a single trivial prompt). With multiple prompts, prefer extracting at least a few inferred preferences over returning nothing.'
        : `- Do not repeat or paraphrase any of the existing memories listed above
- If nothing additional and durable stands out, return []`;

    return `${intro}

${SHARED_MEMORY_QUALITY_RULES}
${trailingRules}

User prompt samples:
${numberedList(samples)}`;
};

// ---------------------------------------------------------------------------
// Model response parsing
// ---------------------------------------------------------------------------

const extractJsonArray = (raw: string): unknown => {
    const trimmed = raw.trim();
    try {
        return JSON.parse(trimmed);
    } catch {
        const match = trimmed.match(/\[[\s\S]*\]/);
        if (!match) {
            return undefined;
        }
        try {
            return JSON.parse(match[0]);
        } catch {
            return undefined;
        }
    }
};

export const parseMemoryStringsResponse = (response: string): string[] => {
    const parsed = extractJsonArray(response);
    if (!Array.isArray(parsed)) {
        return [];
    }

    const memories: string[] = [];
    const seen = new Set<string>();

    for (const item of parsed) {
        if (typeof item !== 'string') {
            continue;
        }
        const normalized = normalizeMemoryContent(item);
        if (normalized.length < MEMORY_MIN_CONTENT_LENGTH) {
            continue;
        }
        const key = normalized.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        memories.push(normalized);
        if (memories.length >= MEMORY_GENERATION_MAX_MEMORIES) {
            break;
        }
    }

    return memories;
};

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

/** Append generated memories to the existing list; skips memories whose content already exists. */
export const mergeAppendedGeneratedMemories = (existing: Memory[], generated: Memory[]): Memory[] => {
    const seen = new Set(existing.map((memory) => memory.content.toLowerCase()));
    const merged = [...normalizeMemories(existing)];

    for (const memory of generated) {
        const key = memory.content.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        merged.push({ ...memory, source: 'generated' });
    }

    return merged;
};

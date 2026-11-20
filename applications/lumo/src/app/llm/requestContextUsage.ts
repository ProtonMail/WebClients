import type { ChatCompletionsFunctionTool } from '@proton/lumo-api-client/core/types';

import { type Attachment, Role, type Turn } from '../types';
import { IMAGE_TOKEN_ESTIMATE } from './compaction/constants';
import type { RequestContextFileSelection } from './requestContextFiles';
import { countTokens } from './tokenizer';

// The backend adds its base system prompt after the client prepares these turns.
export const SERVER_SYSTEM_PROMPT_TOKEN_ESTIMATE = 4_000;

export type ContextTurn = Turn & {
    contextCategory?: 'files' | 'conversation';
    /** Image markers and omission notices merged into a conversation turn. */
    fileContent?: string;
};

export type RequestTokenUsage = {
    conversationTokens: number;
    toolCallTokens: number;
    instructionTokens: number;
    fileTokens: number;
    usedTokens: number;
};

export type EffectiveContextUsage = RequestTokenUsage & {
    hasCompaction: boolean;
    activeFiles: Attachment[];
    droppedForBudget: Attachment[];
    excerptedForBudget: Map<string, number>;
    cardedFiles: RequestContextFileSelection['cardedFiles'];
};

/** Shared by request preparation, compaction, the indicator and usage calibration. */
export function estimateRequestContextUsage(
    turns: ContextTurn[],
    clientTools: ChatCompletionsFunctionTool[] = []
): RequestTokenUsage {
    const usage: RequestTokenUsage = {
        conversationTokens: 0,
        toolCallTokens: clientTools.length ? countTokens(JSON.stringify(clientTools)) : 0,
        instructionTokens: SERVER_SYSTEM_PROMPT_TOKEN_ESTIMATE,
        fileTokens: 0,
        usedTokens: 0,
    };
    for (const turn of turns) {
        const textTokens = countTokens(turn.content);
        const imageTokens = ((turn.images?.length ?? 0) + (turn.toolImages?.length ?? 0)) * IMAGE_TOKEN_ESTIMATE;
        const tokens = textTokens + imageTokens;
        if (turn.contextCategory === 'files') {
            usage.fileTokens += tokens;
        } else if (turn.role === Role.ToolCall || turn.role === Role.ToolResult) {
            usage.toolCallTokens += tokens;
        } else if (turn.role === Role.System && turn.contextCategory !== 'conversation') {
            usage.instructionTokens += tokens;
        } else {
            const fileTokens = Math.min(textTokens, countTokens(turn.fileContent)) + imageTokens;
            usage.fileTokens += fileTokens;
            usage.conversationTokens += tokens - fileTokens;
        }
    }
    usage.usedTokens = usage.conversationTokens + usage.toolCallTokens + usage.instructionTokens + usage.fileTokens;
    return usage;
}

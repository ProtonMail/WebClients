import type { NormalizedExport } from './parsers';

/** Hard caps to keep the context within the model window and avoid sending huge exports. */
export const PAPER_TRAIL_LIMITS = {
    /** Max characters kept per individual prompt; longer prompts are trimmed. */
    maxCharsPerPrompt: 600,
    /** Max number of prompts included across the whole export. */
    maxPrompts: 400,
    /** Overall character budget for the assembled context. */
    maxTotalChars: 120_000,
};

export interface PaperTrailContext {
    /** The assembled, trimmed context string to attach to the analysis message. */
    text: string;
    /** Stats describing what was included (for UI feedback). */
    stats: {
        source: NormalizedExport['source'];
        conversationCount: number;
        includedPromptCount: number;
        totalPromptCount: number;
        truncated: boolean;
    };
}

const trimPrompt = (prompt: string, maxChars: number): string => {
    const normalized = prompt.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxChars) {
        return normalized;
    }
    return `${normalized.slice(0, maxChars).trimEnd()}…`;
};

/**
 * Build the LLM context from a parsed export. Only the user's own prompts are kept
 * (assistant replies are dropped), each prompt is trimmed, and the total is capped
 * so we never ship an oversized payload. Nothing here is persisted.
 */
export const buildPaperTrailContext = (
    exportData: NormalizedExport,
    limits = PAPER_TRAIL_LIMITS
): PaperTrailContext => {
    const lines: string[] = [];
    let includedPromptCount = 0;
    let totalPromptCount = 0;
    let truncated = false;
    let totalChars = 0;

    for (const conversation of exportData.conversations) {
        totalPromptCount += conversation.userPrompts.length;
    }

    for (const conversation of exportData.conversations) {
        if (includedPromptCount >= limits.maxPrompts || totalChars >= limits.maxTotalChars) {
            truncated = true;
            break;
        }

        const conversationLines: string[] = [`## ${conversation.title}`];
        for (const prompt of conversation.userPrompts) {
            if (includedPromptCount >= limits.maxPrompts || totalChars >= limits.maxTotalChars) {
                truncated = true;
                break;
            }
            const trimmed = trimPrompt(prompt, limits.maxCharsPerPrompt);
            if (!trimmed) {
                continue;
            }
            const line = `- ${trimmed}`;
            conversationLines.push(line);
            includedPromptCount += 1;
            totalChars += line.length + 1;
        }

        if (conversationLines.length > 1) {
            lines.push(conversationLines.join('\n'), '');
        }
    }

    if (includedPromptCount < totalPromptCount) {
        truncated = true;
    }

    return {
        text: lines.join('\n').trim(),
        stats: {
            source: exportData.source,
            conversationCount: exportData.conversations.length,
            includedPromptCount,
            totalPromptCount,
            truncated,
        },
    };
};

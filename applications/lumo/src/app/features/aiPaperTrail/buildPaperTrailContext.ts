import type { NormalizedExport, NormalizedUserPrompt } from './parsers';

/** Hard caps to keep the context within the model window and avoid sending huge exports. */
export const PAPER_TRAIL_LIMITS = {
    /** Max characters kept per individual prompt; longer prompts are trimmed. */
    maxCharsPerPrompt: 600,
    /** Max number of most-recent user prompts included across the whole export. */
    maxPrompts: 200,
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

interface FlatPrompt extends NormalizedUserPrompt {
    conversationTitle: string;
    sortKey: number;
}

const trimPrompt = (prompt: string, maxChars: number): string => {
    const normalized = prompt.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxChars) {
        return normalized;
    }
    return `${normalized.slice(0, maxChars).trimEnd()}…`;
};

const flattenPrompts = (exportData: NormalizedExport): FlatPrompt[] => {
    const flat: FlatPrompt[] = [];
    let fallbackOrder = 0;

    for (const conversation of exportData.conversations) {
        for (const prompt of conversation.userPrompts) {
            const text = prompt.text.replace(/\s+/g, ' ').trim();
            if (!text) {
                continue;
            }
            flat.push({
                text,
                createdAt: prompt.createdAt,
                conversationTitle: conversation.title,
                sortKey: prompt.createdAt ?? conversation.createdAt ?? fallbackOrder++,
            });
        }
    }

    return flat;
};

/**
 * Build the LLM context from a parsed export. Only the user's own prompts are kept
 * (assistant replies are dropped), the most recent prompts are selected, each prompt
 * is trimmed, and the total is capped so we never ship an oversized payload.
 * Nothing here is persisted.
 */
export const buildPaperTrailContext = (
    exportData: NormalizedExport,
    limits = PAPER_TRAIL_LIMITS
): PaperTrailContext => {
    const flatPrompts = flattenPrompts(exportData);
    const totalPromptCount = flatPrompts.length;

    flatPrompts.sort((a, b) => b.sortKey - a.sortKey || b.text.localeCompare(a.text));

    const lines: string[] = [];
    let includedPromptCount = 0;
    let truncated = totalPromptCount > limits.maxPrompts;
    let totalChars = 0;
    const grouped = new Map<string, { sortKey: number; lines: string[] }>();

    for (const prompt of flatPrompts) {
        if (includedPromptCount >= limits.maxPrompts || totalChars >= limits.maxTotalChars) {
            truncated = true;
            break;
        }

        const trimmed = trimPrompt(prompt.text, limits.maxCharsPerPrompt);
        if (!trimmed) {
            continue;
        }

        const line = `- ${trimmed}`;
        const group = grouped.get(prompt.conversationTitle) ?? {
            sortKey: prompt.sortKey,
            lines: [],
        };
        group.lines.push(line);
        group.sortKey = Math.max(group.sortKey, prompt.sortKey);
        grouped.set(prompt.conversationTitle, group);

        includedPromptCount += 1;
        totalChars += line.length + 1;
    }

    const orderedGroups = [...grouped.entries()].sort((a, b) => b[1].sortKey - a[1].sortKey);
    for (const [title, group] of orderedGroups) {
        lines.push(`## ${title}`, ...group.lines, '');
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

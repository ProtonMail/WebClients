export type PaperTrailSource = 'chatgpt' | 'claude';

export interface NormalizedConversation {
    title: string;
    /** User-authored prompts only, in chronological order. Assistant replies are discarded. */
    userPrompts: string[];
    /** Epoch seconds, when available. */
    createdAt?: number;
}

export interface NormalizedExport {
    source: PaperTrailSource;
    conversations: NormalizedConversation[];
}

/** Thrown when an upload cannot be recognised or parsed as a supported AI export. */
export class PaperTrailParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PaperTrailParseError';
    }
}

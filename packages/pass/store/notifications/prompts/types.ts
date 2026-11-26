/** Identifier of a client-side prompt definition. Extensible as
 * sibling prompts land (default-manager, password-reminder, ...) */
export type PromptId = 'offline-banner' | 'offline-onpage';

export type PromptDismissal = {
    /** How many times the prompt was dismissed */
    count: number;
    /** Epoch timestamp (in seconds) of the last dismissal */
    lastDismissedAt: number;
};

/** The dismissal ledger: the only genuinely stateful part of the
 * prompt decision layer. Definitions & cadences live in code and
 * resolve against this ledger in the projection selector. */
export type PromptsState = Partial<Record<PromptId, PromptDismissal>>;

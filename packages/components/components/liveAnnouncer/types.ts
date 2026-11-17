interface AnnounceOptions {
    /** Announcements sharing a key within the de-dup window are dropped. Defaults to the text. */
    dedupeKey?: string;
    priority?: number;
    /** Polite announcements wait for the screen reader to finish speaking. Defaults to assertive. */
    politeness?: 'polite' | 'assertive';
    /** Polite only. A queued message still waiting after this long is dropped. Without it, the message waits as long as it takes. */
    maxWaitMs?: number;
}

export enum AnnouncementPriority {
    // Low = 0,
    Normal = 1,
    High = 2,
}

export type AnnounceFn = (message: string, options?: AnnounceOptions) => void;

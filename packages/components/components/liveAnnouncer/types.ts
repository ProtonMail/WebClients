interface AnnounceOptions {
    /** Announcements sharing a key within the de-dup window are dropped. Defaults to the text. */
    dedupeKey?: string;
    priority?: number;
}

export enum AnnouncementPriority {
    // Low = 0,
    Normal = 1,
    High = 2,
}

export type AnnounceFn = (message: string, options?: AnnounceOptions) => void;

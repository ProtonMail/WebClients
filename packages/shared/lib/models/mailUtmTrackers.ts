export interface MessageUTMTracker {
    originalURL: string;
    cleanedURL: string;
    removed: { key: string; value: string }[];
}

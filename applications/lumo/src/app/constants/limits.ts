export const MAX_MESSAGES_PER_CONVERSATION = 250;
export const MAX_ASSETS_PER_SPACE = 100;
export const MAX_CONVERSATIONS_PER_SPACE = 100;
export const MAX_SPACES_PER_USER = 10000;
export const FREE_USER_CHAT_RETENTION_DAYS = 7;
/** Extra days after the retention window before a free-user chat is deleted client-side. */
export const FREE_USER_CHAT_DELETION_GRACE_DAYS = 1;

// Fraction of the limit at which we start warning the user.
// E.g. 0.9 means warn when they have reached 90% of the
// limit (10% remaining).
export const APPROACHING_LIMIT_RATIO = 0.9;

export type ResourceLimitType = 'messages' | 'assets' | 'conversations' | 'spaces';

export const RESOURCE_LIMITS: Record<ResourceLimitType, number> = {
    messages: MAX_MESSAGES_PER_CONVERSATION,
    assets: MAX_ASSETS_PER_SPACE,
    conversations: MAX_CONVERSATIONS_PER_SPACE,
    spaces: MAX_SPACES_PER_USER,
};

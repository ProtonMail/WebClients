export const EXPIRING_SOON_THRESHOLD = 3600;

export const getExpirationTimestampFromMinutes = (minutes: number) => Math.floor(Date.now() / 1000) + minutes * 60;

export const formatDate = (unixTs: number) =>
    new Date(unixTs * 1000).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

export const getDaysRemaining = (unixTs: number) => {
    const diff = unixTs - Math.floor(Date.now() / 1000);
    return Math.ceil(diff / 86400);
};

export const getHoursRemaining = (unixTs: number) => {
    const diff = unixTs - Math.floor(Date.now() / 1000);
    return Math.ceil(diff / 3600);
};

export type TokenStatus = 'active' | 'expiring' | 'expired';

export const getTokenStatus = (expireTime: number): TokenStatus => {
    const now = Math.floor(Date.now() / 1000);
    if (expireTime < now) return 'expired';
    if (expireTime - now < EXPIRING_SOON_THRESHOLD) return 'expiring';
    return 'active';
};

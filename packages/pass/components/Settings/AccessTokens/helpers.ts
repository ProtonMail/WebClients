export const EXPIRING_SOON_THRESHOLD = 3600;

export const getExpirationTimestampFromMinutes = (minutes: number) => Math.floor(Date.now() / 1000) + minutes * 60;

export type TokenStatus = 'active' | 'expiring' | 'expired';

export const getTokenStatus = (expireTime: number): TokenStatus => {
    const now = Math.floor(Date.now() / 1000);
    if (expireTime < now) return 'expired';
    if (expireTime - now < EXPIRING_SOON_THRESHOLD) return 'expiring';
    return 'active';
};

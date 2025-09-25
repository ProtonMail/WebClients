export const getPublicLinkIsExpired = (expirationTime: Date | undefined) =>
    Boolean(expirationTime && expirationTime < new Date());

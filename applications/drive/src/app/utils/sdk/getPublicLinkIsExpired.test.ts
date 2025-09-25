import { getPublicLinkIsExpired } from './getPublicLinkIsExpired';

describe('getPublicLinkIsExpired', () => {
    it('should return false when expirationTime is undefined', () => {
        const result = getPublicLinkIsExpired(undefined);

        expect(result).toBe(false);
    });

    it('should return false when expirationTime is in the future', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const result = getPublicLinkIsExpired(futureDate);

        expect(result).toBe(false);
    });

    it('should return true when expirationTime is in the past', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = getPublicLinkIsExpired(pastDate);

        expect(result).toBe(true);
    });
});

import { ImportProvider } from '../interface';
import { type SupportedProvider, getProviderFromRouteSlug, getProviderRouteSlug } from './providers';

describe('getProviderFromRouteSlug', () => {
    it('resolves "microsoft" to ImportProvider.OUTLOOK', () => {
        expect(getProviderFromRouteSlug('microsoft')).toBe(ImportProvider.OUTLOOK);
    });

    it('resolves "google" to ImportProvider.GOOGLE', () => {
        expect(getProviderFromRouteSlug('google')).toBe(ImportProvider.GOOGLE);
    });

    it('returns undefined for an unknown slug, without falling back to a default provider', () => {
        expect(getProviderFromRouteSlug('yahoo')).toBeUndefined();
        expect(getProviderFromRouteSlug('outlook')).toBeUndefined();
        expect(getProviderFromRouteSlug('')).toBeUndefined();
        expect(getProviderFromRouteSlug('MICROSOFT')).toBeUndefined();
    });
});

describe('getProviderRouteSlug', () => {
    it('maps ImportProvider.OUTLOOK to "microsoft"', () => {
        expect(getProviderRouteSlug(ImportProvider.OUTLOOK)).toBe('microsoft');
    });

    it('maps ImportProvider.GOOGLE to "google"', () => {
        expect(getProviderRouteSlug(ImportProvider.GOOGLE)).toBe('google');
    });

    it('throws instead of silently returning a fallback value for a non-OLES provider', () => {
        // TypeScript already rejects these calls at compile time (getProviderRouteSlug only
        // accepts a SupportedProvider); the cast simulates a caller that bypasses the type
        // system, so we can verify the runtime behaviour is a hard failure, not bad data.
        expect(() => getProviderRouteSlug(ImportProvider.YAHOO as unknown as SupportedProvider)).toThrow();
        expect(() => getProviderRouteSlug(ImportProvider.DEFAULT as unknown as SupportedProvider)).toThrow();
    });
});

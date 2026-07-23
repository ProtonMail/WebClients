import { isPublicPathname } from './lumoRoutes';

describe('isPublicPathname', () => {
    it('treats guest routes as public', () => {
        expect(isPublicPathname('/guest')).toBe(true);
        expect(isPublicPathname('/guest/ai-paper-trail')).toBe(true);
    });

    it('treats agent routes as public', () => {
        expect(isPublicPathname('/agent')).toBe(true);
        expect(isPublicPathname('/agent/foo')).toBe(true);
    });

    it('treats the marketing paper trail URL as public', () => {
        expect(isPublicPathname('/ai-paper-trail')).toBe(true);
    });

    it('treats authenticated routes as private', () => {
        expect(isPublicPathname('/u/abc123')).toBe(false);
        expect(isPublicPathname('/u/abc123/ai-paper-trail')).toBe(false);
    });
});

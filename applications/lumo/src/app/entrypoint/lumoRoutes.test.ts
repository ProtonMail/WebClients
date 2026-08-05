import { LUMO_ROUTES, getPaperTrailExitPath, isPublicPathname, isStandalonePaperTrailPath } from './lumoRoutes';

describe('isPublicPathname', () => {
    it('treats guest routes as public', () => {
        expect(isPublicPathname('/guest')).toBe(true);
        expect(isPublicPathname(`/guest${LUMO_ROUTES.AI_PAPER_TRAIL}`)).toBe(true);
    });

    it('treats agent routes as public', () => {
        expect(isPublicPathname('/agent')).toBe(true);
        expect(isPublicPathname('/agent/foo')).toBe(true);
    });

    it('treats the marketing paper trail URL as public', () => {
        expect(isPublicPathname(LUMO_ROUTES.AI_PAPER_TRAIL)).toBe(true);
    });

    it('treats authenticated routes as private', () => {
        expect(isPublicPathname('/u/abc123')).toBe(false);
        expect(isPublicPathname(`/u/abc123${LUMO_ROUTES.AI_PAPER_TRAIL}`)).toBe(false);
    });
});

describe('getPaperTrailExitPath', () => {
    it('returns Lumo root', () => {
        expect(getPaperTrailExitPath()).toBe('/');
    });
});

describe('isStandalonePaperTrailPath', () => {
    it('matches only the standalone campaign URL', () => {
        expect(isStandalonePaperTrailPath(LUMO_ROUTES.AI_PAPER_TRAIL)).toBe(true);
        expect(isStandalonePaperTrailPath(`/guest${LUMO_ROUTES.AI_PAPER_TRAIL}`)).toBe(false);
        expect(isStandalonePaperTrailPath(`/u/abc123${LUMO_ROUTES.AI_PAPER_TRAIL}`)).toBe(false);
    });
});

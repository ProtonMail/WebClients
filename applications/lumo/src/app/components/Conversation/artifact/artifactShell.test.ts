import { isArtifactShellCrossOrigin } from './artifactShell';

describe('isArtifactShellCrossOrigin', () => {
    it('returns false when the shell is served on the same origin (localhost path-prefix)', () => {
        expect(isArtifactShellCrossOrigin('https://localhost:3000')).toBe(false);
    });

    it('returns false for IP-literal hosts that use the /api path prefix', () => {
        expect(isArtifactShellCrossOrigin('https://34.234.12.145')).toBe(false);
    });

    it('returns true when the shell is on the API subdomain', () => {
        expect(isArtifactShellCrossOrigin('https://lumo.proton.dev:4443')).toBe(true);
    });

    it('returns true on prod-style hostnames', () => {
        expect(isArtifactShellCrossOrigin('https://lumo.proton.me')).toBe(true);
    });
});

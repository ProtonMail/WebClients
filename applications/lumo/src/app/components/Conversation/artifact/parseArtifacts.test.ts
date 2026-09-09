import { getFileExtension, hashArtifactIdentity } from './parseArtifacts';

describe('hashArtifactIdentity', () => {
    it('returns a stable legacy-prefixed id for the same inputs', () => {
        const first = hashArtifactIdentity('document', 'Poem', 'Roses are red');
        const second = hashArtifactIdentity('document', 'Poem', 'Roses are red');

        expect(first).toBe(second);
        expect(first).toMatch(/^legacy-/);
    });

    it('changes when content changes', () => {
        const first = hashArtifactIdentity('document', 'Poem', 'Roses are red');
        const second = hashArtifactIdentity('document', 'Poem', 'Roses are red, violets are blue');

        expect(first).not.toBe(second);
    });
});

describe('getFileExtension', () => {
    it('maps known languages', () => {
        expect(getFileExtension('python')).toBe('py');
        expect(getFileExtension('typescript')).toBe('ts');
    });

    it('falls back to txt for unknown languages', () => {
        expect(getFileExtension('not-a-language')).toBe('txt');
    });
});

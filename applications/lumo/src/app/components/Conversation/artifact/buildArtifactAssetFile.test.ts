import { artifactTypeSupportsAssetSync } from './artifactAssetSyncSupport';
import { buildArtifactAssetFile } from './buildArtifactAssetFile';

describe('artifactTypeSupportsAssetSync', () => {
    it('supports document artifacts only in the MVP', () => {
        expect(artifactTypeSupportsAssetSync('document')).toBe(true);
        expect(artifactTypeSupportsAssetSync('code')).toBe(false);
        expect(artifactTypeSupportsAssetSync('presentation')).toBe(false);
        expect(artifactTypeSupportsAssetSync('webpage')).toBe(false);
    });
});

describe('buildArtifactAssetFile', () => {
    it('uploads create_artifact content unchanged', async () => {
        const raw = '# Title\n\n```card\n{"title":"x"}\n```\n';
        const file = await buildArtifactAssetFile({
            id: 'a',
            type: 'document',
            title: 'My Doc',
            content: raw,
        });
        expect(file.data).toBe(raw);
        expect(file.mimeType).toBe('text/markdown');
    });
});

import { artifactTypeSupportsAssetSync } from './artifactAssetSyncSupport';
import { buildArtifactAssetFile } from './buildArtifactAssetFile';

jest.mock('./artifactSourceDownload', () => {
    return {
        buildArtifactSourceDownloadFile: jest.fn(async () => {
            return {
                data: '# Title',
                fileName: 'My Doc.md',
                mimeType: 'text/markdown;charset=utf-8',
            };
        }),
    };
});

describe('artifactTypeSupportsAssetSync', () => {
    it('supports all side-panel artifact types', () => {
        expect(artifactTypeSupportsAssetSync('document')).toBe(true);
        expect(artifactTypeSupportsAssetSync('code')).toBe(true);
        expect(artifactTypeSupportsAssetSync('presentation')).toBe(true);
        expect(artifactTypeSupportsAssetSync('webpage')).toBe(true);
    });
});

describe('buildArtifactAssetFile', () => {
    it('delegates to buildArtifactSourceDownloadFile', async () => {
        const { buildArtifactSourceDownloadFile } = jest.requireMock('./artifactSourceDownload');
        const artifact = {
            id: 'a',
            type: 'document' as const,
            title: 'My Doc',
            content: '# Title',
        };
        const file = await buildArtifactAssetFile(artifact);
        expect(buildArtifactSourceDownloadFile).toHaveBeenCalledWith(artifact);
        expect(file.fileName).toBe('My Doc.md');
    });
});

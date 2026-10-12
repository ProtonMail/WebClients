import { getArtifactSourceDownloadExtension } from './artifactSourceDownloadExtension';

describe('getArtifactSourceDownloadExtension', () => {
    it('returns md, language ext, or html by type', () => {
        expect(
            getArtifactSourceDownloadExtension({
                id: 'a',
                type: 'document',
                title: 'Doc',
                content: '# Hi',
            })
        ).toBe('md');

        expect(
            getArtifactSourceDownloadExtension({
                id: 'a',
                type: 'code',
                title: 'Script',
                content: 'x',
                language: 'typescript',
            })
        ).toBe('ts');

        expect(
            getArtifactSourceDownloadExtension({
                id: 'a',
                type: 'webpage',
                title: 'Page',
                content: '<p>x</p>',
            })
        ).toBe('html');
    });
});

import { buildArtifactSourceDownloadFile } from './artifactSourceDownload';

jest.mock('./artifactHtmlDocument', () => {
    return {
        buildArtifactFileName: (_artifact: { title: string }, extension: string) => {
            return `file.${extension}`;
        },
    };
});

jest.mock('./artifactPresentationStandalone', () => {
    return {
        buildStandalonePresentationHtml: jest.fn(async () => {
            return '<!DOCTYPE html><html><body>deck</body></html>';
        }),
    };
});

describe('buildArtifactSourceDownloadFile', () => {
    it('builds document markdown', async () => {
        const raw = '# Title';
        const file = await buildArtifactSourceDownloadFile({
            id: 'a',
            type: 'document',
            title: 'My Doc',
            content: raw,
        });
        expect(file.data).toBe(raw);
        expect(file.mimeType).toBe('text/markdown;charset=utf-8');
        expect(file.fileName).toBe('file.md');
    });

    it('builds code source', async () => {
        const file = await buildArtifactSourceDownloadFile({
            id: 'a',
            type: 'code',
            title: 'Calculator',
            content: 'export const x = 1;',
            language: 'typescript',
        });
        expect(file.data).toBe('export const x = 1;');
        expect(file.fileName).toBe('file.ts');
        expect(file.mimeType).toBe('text/plain;charset=utf-8');
    });

    it('builds webpage html', async () => {
        const html = '<html><body>Hi</body></html>';
        const file = await buildArtifactSourceDownloadFile({
            id: 'a',
            type: 'webpage',
            title: 'Landing',
            content: html,
        });
        expect(file.data).toBe(html);
        expect(file.fileName).toBe('file.html');
        expect(file.mimeType).toBe('text/html;charset=utf-8');
    });

    it('builds presentation standalone html', async () => {
        const file = await buildArtifactSourceDownloadFile({
            id: 'a',
            type: 'presentation',
            title: 'Deck',
            content: '<section><h1>Slide</h1></section>',
        });
        expect(file.data).toContain('deck');
        expect(file.fileName).toBe('file.html');
        expect(file.mimeType).toBe('text/html;charset=utf-8');
    });
});

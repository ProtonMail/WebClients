import { downloadHtmlSlidesAsPptx } from '../../../util/pptx/downloadHtmlAsPptx';
import { buildPresentationSlideExportDocuments } from './artifactHtmlDocument';
import { artifactSupportsPptxExport, downloadArtifactPptx } from './artifactPptxExport';
import type { ParsedArtifact } from './parseArtifacts';

jest.mock('../../../util/pptx/downloadHtmlAsPptx', () => {
    return {
        downloadHtmlSlidesAsPptx: jest.fn(async () => {}),
    };
});

jest.mock('./artifactHtmlDocument', () => {
    return {
        PRESENTATION_PPTX_EXPORT_OPTIONS: { viewportWidth: 960 },
        artifactSupportsPptxExport: (type: string) => {
            return type === 'presentation';
        },
        buildArtifactFileName: (artifact: ParsedArtifact, extension: string) => {
            return `${artifact.title.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
        },
        buildPresentationSlideExportDocuments: jest.fn(async (artifact: ParsedArtifact) => {
            if (!artifact.content.trim()) {
                return [];
            }

            return [`<html><body>${artifact.content}</body></html>`];
        }),
    };
});

const mockDownloadHtmlSlidesAsPptx = jest.mocked(downloadHtmlSlidesAsPptx);
const mockBuildPresentationSlideExportDocuments = jest.mocked(buildPresentationSlideExportDocuments);

describe('artifactSupportsPptxExport', () => {
    it('supports presentation artifacts only', () => {
        expect(artifactSupportsPptxExport('presentation')).toBe(true);
        expect(artifactSupportsPptxExport('document')).toBe(false);
        expect(artifactSupportsPptxExport('code')).toBe(false);
    });
});

describe('downloadArtifactPptx', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDownloadHtmlSlidesAsPptx.mockResolvedValue(undefined);
    });

    it('downloads a presentation artifact as pptx', async () => {
        const artifact: ParsedArtifact = {
            id: 'deck-1',
            type: 'presentation',
            title: 'Quarterly Review',
            content: '<section><h2>Intro</h2></section>',
        };

        const result = await downloadArtifactPptx(artifact);

        expect(result).toBe('success');
        expect(mockBuildPresentationSlideExportDocuments).toHaveBeenCalledWith(
            artifact,
            expect.objectContaining({ onPrepareProgress: undefined })
        );
        expect(mockDownloadHtmlSlidesAsPptx).toHaveBeenCalledWith(
            ['<html><body><section><h2>Intro</h2></section></body></html>'],
            'quarterly-review.pptx',
            expect.objectContaining({ viewportWidth: 960 })
        );
    });

    it('returns unavailable for non-presentation artifacts', async () => {
        const artifact: ParsedArtifact = {
            id: 'doc-1',
            type: 'document',
            title: 'Notes',
            content: '# Hello',
        };

        await expect(downloadArtifactPptx(artifact)).resolves.toBe('unavailable');
        expect(mockDownloadHtmlSlidesAsPptx).not.toHaveBeenCalled();
    });

    it('returns unavailable when slide content is blank', async () => {
        const artifact: ParsedArtifact = {
            id: 'deck-2',
            type: 'presentation',
            title: 'Empty',
            content: '   ',
        };

        await expect(downloadArtifactPptx(artifact)).resolves.toBe('unavailable');
        expect(mockDownloadHtmlSlidesAsPptx).not.toHaveBeenCalled();
    });

    it('returns failed when pptx generation throws', async () => {
        mockDownloadHtmlSlidesAsPptx.mockRejectedValueOnce(new Error('export failed'));

        const artifact: ParsedArtifact = {
            id: 'deck-3',
            type: 'presentation',
            title: 'Broken',
            content: '<section><h2>Oops</h2></section>',
        };

        await expect(downloadArtifactPptx(artifact)).resolves.toBe('failed');
    });
});

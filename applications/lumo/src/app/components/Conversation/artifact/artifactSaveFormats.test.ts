import {
    artifactSupportsSaveToDrive,
    getArtifactFormatMenuLabel,
    getArtifactSaveFormatLabel,
    getArtifactSaveFormats,
    getArtifactSourceMenuLabel,
} from './artifactSaveFormats';

describe('artifactSaveFormats', () => {
    it('returns document save formats', () => {
        expect(getArtifactSaveFormats('document')).toEqual(['docx', 'pdf', 'md', 'txt']);
        expect(artifactSupportsSaveToDrive('document')).toBe(true);
    });

    it('returns presentation save formats', () => {
        expect(getArtifactSaveFormats('presentation')).toEqual(['pdf', 'pptx']);
        expect(artifactSupportsSaveToDrive('presentation')).toBe(true);
    });

    it('does not support code or webpage save-to-drive in phase 1', () => {
        expect(getArtifactSaveFormats('code')).toEqual([]);
        expect(getArtifactSaveFormats('webpage')).toEqual([]);
        expect(artifactSupportsSaveToDrive('code')).toBe(false);
    });

    it('provides human-readable labels', () => {
        expect(getArtifactSaveFormatLabel('docx')).toBe('Word (.docx)');
        expect(getArtifactSaveFormatLabel('md')).toContain('Source');
        expect(getArtifactSaveFormatLabel('md')).toContain('Markdown');
        expect(getArtifactSaveFormatLabel('txt')).toContain('Plain text');
        expect(getArtifactSaveFormatLabel('pdf')).toBe('PDF');
        expect(getArtifactSaveFormatLabel('pptx')).toContain('PowerPoint');
    });

    it("names formats and each type's source download for the title menu", () => {
        expect(getArtifactFormatMenuLabel('md')).toBe('Markdown');
        expect(getArtifactFormatMenuLabel('docx')).toBe('Word document');
        expect(getArtifactFormatMenuLabel('pptx')).toBe('PowerPoint');
        expect(getArtifactSourceMenuLabel('document')).toBe('Markdown');
        expect(getArtifactSourceMenuLabel('presentation')).toBe('Web presentation');
        expect(getArtifactSourceMenuLabel('webpage')).toBe('Webpage');
        expect(getArtifactSourceMenuLabel('code')).toBe('Source file');
    });
});

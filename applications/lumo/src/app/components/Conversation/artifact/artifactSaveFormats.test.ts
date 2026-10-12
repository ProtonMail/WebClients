import {
    artifactSupportsSaveToDrive,
    getArtifactDownloadLabel,
    getArtifactSaveFormatLabel,
    getArtifactSaveFormats,
    getArtifactSourceDownloadLabel,
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

    it('provides download labels that distinguish source, plain text, and exports', () => {
        expect(getArtifactSourceDownloadLabel('document')).toContain('Markdown');
        expect(getArtifactSourceDownloadLabel('presentation')).toContain('HTML');
        expect(getArtifactDownloadLabel('txt')).toContain('plain text');
        expect(getArtifactDownloadLabel('pdf')).toContain('PDF');
        expect(getArtifactDownloadLabel('docx')).toBe('Download Word (.docx)');
    });

    it('labels document PDF as a dialog-backed save and presentation PDF as a download', () => {
        expect(getArtifactDownloadLabel('pdf', 'document')).toBe('Save as PDF…');
        expect(getArtifactDownloadLabel('pdf', 'presentation')).toBe('Download PDF');
    });
});

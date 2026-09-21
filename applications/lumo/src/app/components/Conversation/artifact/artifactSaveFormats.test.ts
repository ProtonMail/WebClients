import {
    artifactSupportsSaveToDrive,
    getArtifactDownloadLabel,
    getArtifactSaveFormatLabel,
    getArtifactSaveFormats,
    getArtifactSourceDownloadLabel,
} from './artifactSaveFormats';

describe('artifactSaveFormats', () => {
    it('returns document save formats', () => {
        expect(getArtifactSaveFormats('document')).toEqual(['md', 'txt', 'pdf']);
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
    });
});

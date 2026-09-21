import { sanitizeArtifactExportBodyHtml } from './sanitizeArtifactExportBodyHtml';

describe('sanitizeArtifactExportBodyHtml', () => {
    it('preserves benign markdown-derived markup', () => {
        const html = '<h1>Summary</h1><p>Hello <strong>world</strong></p><ul><li>One</li></ul>';

        expect(sanitizeArtifactExportBodyHtml(html)).toContain('<h1>Summary</h1>');
        expect(sanitizeArtifactExportBodyHtml(html)).toContain('<strong>world</strong>');
    });

    it('preserves inline SVG produced by chart export', () => {
        const html =
            '<div class="lumo-chart"><svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#000" /></svg></div>';

        expect(sanitizeArtifactExportBodyHtml(html)).toContain('<svg');
        expect(sanitizeArtifactExportBodyHtml(html)).toContain('<rect');
    });

    it('strips inline event handlers', () => {
        const html = '<img src="x" onerror="alert(1)" alt="x">';

        expect(sanitizeArtifactExportBodyHtml(html)).not.toMatch(/onerror/i);
    });

    it('strips script tags and active content containers', () => {
        const html =
            '<section><script>alert(1)</script><iframe src="https://example.com"></iframe><object data="x"></object></section>';

        const sanitized = sanitizeArtifactExportBodyHtml(html);

        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<object');
    });

    it('blocks javascript: URLs in links', () => {
        const html = '<a href="javascript:alert(1)">Click</a>';

        expect(sanitizeArtifactExportBodyHtml(html)).not.toContain('javascript:');
    });

    it('allows https image sources', () => {
        const html = '<img src="https://example.com/chart.png" alt="chart">';

        expect(sanitizeArtifactExportBodyHtml(html)).toContain('https://example.com/chart.png');
    });
});

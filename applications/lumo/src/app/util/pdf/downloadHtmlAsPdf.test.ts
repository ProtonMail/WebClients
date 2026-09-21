import { ensurePdfFileName } from './downloadHtmlAsPdf';

describe('ensurePdfFileName', () => {
    it('appends .pdf when missing', () => {
        expect(ensurePdfFileName('report')).toBe('report.pdf');
    });

    it('preserves an existing .pdf extension', () => {
        expect(ensurePdfFileName('report.pdf')).toBe('report.pdf');
    });
});

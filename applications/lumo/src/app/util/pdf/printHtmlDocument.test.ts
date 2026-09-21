import { printHtmlDocument } from './printHtmlDocument';

describe('printHtmlDocument', () => {
    it('opens a window without noopener so the print fallback can access it', () => {
        const printWindow = {
            opener: window,
            document: {
                open: jest.fn(),
                write: jest.fn(),
                close: jest.fn(),
                readyState: 'complete',
            },
            focus: jest.fn(),
            print: jest.fn(),
            addEventListener: jest.fn(),
        } as unknown as Window;

        const openSpy = jest.spyOn(window, 'open').mockReturnValue(printWindow);

        expect(printHtmlDocument('<html><body>Report</body></html>')).toBe(true);
        expect(openSpy).toHaveBeenCalledWith('', '_blank');
        expect(printWindow.opener).toBeNull();
        expect(printWindow.print).toHaveBeenCalled();

        openSpy.mockRestore();
    });

    it('returns false when the browser blocks popups', () => {
        const openSpy = jest.spyOn(window, 'open').mockReturnValue(null);

        expect(printHtmlDocument('<html><body>Report</body></html>')).toBe(false);

        openSpy.mockRestore();
    });
});

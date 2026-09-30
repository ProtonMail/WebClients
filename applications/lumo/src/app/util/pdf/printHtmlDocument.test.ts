import { printHtmlDocument } from './printHtmlDocument';

const getPrintFrame = (): HTMLIFrameElement | null => {
    return document.querySelector('iframe[data-print-frame]');
};

describe('printHtmlDocument', () => {
    let printSpy: jest.SpyInstance | undefined;
    const originalTitle = document.title;
    const originalAppendChild = document.body.appendChild.bind(document.body);

    beforeEach(() => {
        // Spy on print() for each frame as it is attached, since every iframe has its own window.
        jest.spyOn(document.body, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
            const appended = originalAppendChild(node);
            if (node instanceof HTMLIFrameElement && node.contentWindow) {
                printSpy = jest.spyOn(node.contentWindow, 'print').mockImplementation(() => {});
            }
            return appended;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        printSpy = undefined;
        document.title = originalTitle;
        document.querySelectorAll('iframe[data-print-frame]').forEach((node) => {
            node.remove();
        });
    });

    it('prints from a hidden sandboxed iframe instead of opening a popup', async () => {
        const openSpy = jest.spyOn(window, 'open');

        await expect(printHtmlDocument('<html><body><p>Report</p></body></html>')).resolves.toBe(true);

        const frame = getPrintFrame();
        expect(openSpy).not.toHaveBeenCalled();
        expect(printSpy).toHaveBeenCalledTimes(1);
        expect(frame?.getAttribute('sandbox')).toBe('allow-same-origin allow-modals');
        expect(frame?.getAttribute('sandbox')).not.toContain('allow-scripts');
        expect(frame?.contentDocument?.body.textContent).toContain('Report');
    });

    it('strips scripts from the printed document', async () => {
        await printHtmlDocument('<html><body><p>Safe</p><script>window.printScriptRan = true</script></body></html>');

        const frame = getPrintFrame();
        expect(frame?.contentDocument?.querySelector('script')).toBeNull();
        expect((window as Window & { printScriptRan?: boolean }).printScriptRan).toBeUndefined();
    });

    it('uses the title while printing and restores the page title and removes the frame afterwards', async () => {
        document.title = 'Lumo';

        await printHtmlDocument('<html><body><p>Report</p></body></html>', { title: 'Q3 Board Update' });

        const frame = getPrintFrame();
        expect(document.title).toBe('Q3 Board Update');
        expect(frame?.contentDocument?.title).toBe('Q3 Board Update');

        frame?.contentWindow?.dispatchEvent(new Event('afterprint'));

        expect(document.title).toBe('Lumo');
        expect(getPrintFrame()).toBeNull();
    });

    it('returns false and cleans up when printing throws', async () => {
        jest.spyOn(document.body, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
            const appended = originalAppendChild(node);
            if (node instanceof HTMLIFrameElement && node.contentWindow) {
                jest.spyOn(node.contentWindow, 'print').mockImplementation(() => {
                    throw new Error('print blocked');
                });
            }
            return appended;
        });

        await expect(printHtmlDocument('<html><body><p>Report</p></body></html>')).resolves.toBe(false);
        expect(getPrintFrame()).toBeNull();
    });
});

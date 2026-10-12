/**
 * Safety net for removing the print frame if `afterprint` never fires. Generous on purpose: removing
 * the frame while a non-blocking print dialog (Safari) is still open would blank the printout.
 */
const PRINT_FRAME_CLEANUP_FALLBACK_MS = 10 * 60 * 1000;

export interface PrintHtmlDocumentOptions {
    /**
     * Title shown in the print dialog and used by browsers as the suggested "Save as PDF" file name.
     * Applied to the top-level document too while printing, since some browsers take the name from
     * the top-level page rather than the printed frame.
     */
    title?: string;
}

function stripScripts(ownerDocument: Document): void {
    ownerDocument.querySelectorAll('script').forEach((node) => {
        node.remove();
    });
}

async function waitForPrintResources(ownerDocument: Document): Promise<void> {
    await ownerDocument.fonts?.ready;

    const pendingImages = Array.from(ownerDocument.images).filter((image) => {
        return !image.complete;
    });

    await Promise.all(
        pendingImages.map((image) => {
            return new Promise<void>((resolve) => {
                const done = () => {
                    resolve();
                };
                image.addEventListener('load', done, { once: true });
                image.addEventListener('error', done, { once: true });
            });
        })
    );
}

/**
 * Print a standalone HTML document through the browser's print dialog, where "Save as PDF" gives a
 * PDF with real, selectable text and content-aware page breaks (driven by the document's print CSS).
 *
 * Uses a hidden in-page iframe rather than a popup, so it isn't caught by popup blockers once the
 * user-activation window has expired during async export work. The frame is sandboxed without
 * `allow-scripts` (content is sanitized upstream; scripts are stripped again here); `allow-modals`
 * is required for `print()` to work in a sandboxed frame.
 *
 * Resolves `true` once the print dialog was opened (Chrome blocks until it closes; Safari returns
 * immediately), `false` when printing isn't available so the caller can fall back.
 */
export async function printHtmlDocument(html: string, options: PrintHtmlDocumentOptions = {}): Promise<boolean> {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
    iframe.setAttribute('data-print-frame', 'true');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const printWindow = iframe.contentWindow;
    const printDocument = iframe.contentDocument;
    if (!printWindow || !printDocument) {
        iframe.remove();
        return false;
    }

    const previousTitle = document.title;
    let cleanupTimeoutId: number | undefined;
    const cleanup = () => {
        window.clearTimeout(cleanupTimeoutId);
        // Only restore if nothing else retitled the page while the dialog was open.
        if (options.title && document.title === options.title) {
            document.title = previousTitle;
        }
        iframe.remove();
    };

    try {
        printDocument.open();
        printDocument.write(html);
        printDocument.close();
        stripScripts(printDocument);
        if (options.title) {
            printDocument.title = options.title;
        }

        await waitForPrintResources(printDocument);

        printWindow.addEventListener('afterprint', cleanup, { once: true });
        cleanupTimeoutId = window.setTimeout(cleanup, PRINT_FRAME_CLEANUP_FALLBACK_MS);

        if (options.title) {
            document.title = options.title;
        }

        printWindow.focus();
        printWindow.print();
        return true;
    } catch {
        cleanup();
        return false;
    }
}

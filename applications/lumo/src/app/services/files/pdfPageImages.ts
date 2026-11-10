import { MAX_PDF_PAGE_IMAGES_PER_REQUEST } from '../../lib/attachments/pdfPageLimits';
import type { Attachment, AttachmentId } from '../../types';
import { attachmentDataCache } from '../attachmentDataCache';

/** How long a send waits for page images before going out with the text alone. */
export const SEND_PAGE_IMAGES_MAX_WAIT_MS = 3000;

const inFlight = new Map<AttachmentId, Promise<void>>();

const isRenderablePdf = (attachment: Attachment) =>
    attachment.mimeType === 'application/pdf' && !attachment.processing && !attachment.error;

const hasPages = (attachment: Attachment) =>
    attachmentDataCache.getPageImages(attachment.id) !== undefined || attachment.pageImages !== undefined;

/** Renders the pages of one PDF into the local cache, once. Failures leave the PDF as text only. */
async function renderPdfPages(attachment: Attachment): Promise<void> {
    const data = attachment.data ?? attachmentDataCache.getData(attachment.id);
    if (!data) {
        return;
    }
    const pending = inFlight.get(attachment.id);
    if (pending) {
        return pending;
    }

    const run = (async () => {
        try {
            // Imported lazily: the service pulls in the thumbnail generator, which the request builder does not need.
            const { FileProcessingService } = await import('../fileProcessingService');
            // Only the name and type are read from the file: the bytes travel as `fileData`, copied once and
            // moved to the worker, instead of being copied again by the File and by postMessage.
            const file = new File([], attachment.filename, { type: 'application/pdf' });
            const result = await FileProcessingService.getShared().processFile(file, {
                pdfPagesOnly: true,
                fileData: data.slice().buffer,
                transferFileData: true,
            });
            if (result.type === 'text') {
                // An empty list is cached too, so a PDF without figures is not parsed again on every turn.
                attachmentDataCache.setPageImages(attachment.id, result.pageImages ?? []);
            }
        } catch (error) {
            console.warn(`Could not render the pages of ${attachment.filename}`, error);
        } finally {
            inFlight.delete(attachment.id);
        }
    })();
    inFlight.set(attachment.id, run);
    return run;
}

/**
 * Pages of PDFs are not persisted (they would bloat the encrypted payload), so a PDF loaded from storage
 * has none. Restores them in the local cache for the most recent PDFs, which are the only ones that can
 * fit the per-request page budget. Older PDFs are not rendered once that budget is covered, and every
 * PDF already processed counts toward it, so at most that many PDFs are looked at.
 *
 * With `maxWaitMs`, stops waiting after that long and resolves: rendering carries on in the background and
 * fills the cache for the next request. Use it where the caller would otherwise block a send.
 */
export async function ensureRecentPdfPageImages(
    attachments: Attachment[],
    { maxWaitMs }: { maxWaitMs?: number } = {}
): Promise<void> {
    const toRender: Attachment[] = [];
    let covered = 0;
    for (const attachment of [...attachments].reverse()) {
        if (covered >= MAX_PDF_PAGE_IMAGES_PER_REQUEST) {
            break;
        }
        if (!isRenderablePdf(attachment)) {
            continue;
        }
        if (hasPages(attachment)) {
            // A PDF without figures has an empty list but is just as processed: it counts for at least one,
            // so the walk ends after a bounded number of PDFs however many text-only ones the chat holds.
            covered += Math.max(
                1,
                attachmentDataCache.getPageImages(attachment.id)?.length ?? attachment.pageImages?.length ?? 0
            );
            continue;
        }
        toRender.push(attachment);
        // A rendered PDF yields at least one page when it has any, so each one uses up some of the budget.
        covered += 1;
    }
    const rendering = Promise.all(toRender.map(renderPdfPages)).then(() => undefined);
    if (maxWaitMs === undefined || toRender.length === 0) {
        return rendering;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<void>((resolve) => {
        timer = setTimeout(resolve, maxWaitMs);
    });
    try {
        await Promise.race([rendering, timeout]);
    } finally {
        clearTimeout(timer);
    }
}

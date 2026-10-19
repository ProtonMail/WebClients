import type { GeneratedAssetFromApi } from '../../remote/api';

/**
 * Rows asked for per list request. The list returns metadata only (no blobs), so a page is light;
 * 100 is the server's default and the size backend suggested, since larger values are untested.
 */
export const CREATIONS_LIST_PAGE_SIZE = 100;

/**
 * The list API has no cursor: it returns up to PageSize rows, newest first, with
 * CreateTimeSince <= CreateTime <= CreateTimeUntil (both inclusive, in seconds). This walks back by
 * time instead and returns the next CreateTimeUntil, or undefined when the list is complete.
 *
 * The next window ends *at* the page's oldest second, not one before it: a full page can stop in
 * the middle of a second, and stepping past it would skip the rest of that second. The overlap
 * comes back again, so callers drop assets they have already seen. Only when a whole page shares
 * one second does the cursor step back one second, so the walk always ends.
 */
export function getNextCreationsListUntil(page: GeneratedAssetFromApi[], until: number): number | undefined {
    if (page.length < CREATIONS_LIST_PAGE_SIZE) {
        return undefined;
    }
    const times = page
        .map((asset) => {
            return Math.floor(new Date(asset.CreateTime).getTime() / 1000);
        })
        .filter((time) => {
            return Number.isFinite(time);
        });
    if (times.length === 0) {
        return undefined;
    }
    const oldest = Math.min(...times);
    const next = oldest < until ? oldest : until - 1;
    return next >= 0 ? next : undefined;
}

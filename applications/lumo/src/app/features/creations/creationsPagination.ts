import type { GeneratedAssetFromApi } from '../../remote/api';

// The list endpoint returns pages of this size; a full page means older items may remain.
export const CREATIONS_PAGE_SIZE = 20;

/**
 * Where the next "older" page starts: the oldest CreateTime in the raw page, in seconds. Taken from
 * the raw assets, not the ones kept after filtering (deleted, unknown space…), so a page that is
 * all filtered out still moves the cursor. Undefined when the cursor would not move, which ends
 * paging instead of refetching the same page forever.
 */
export function getOlderPageCursor(assets: GeneratedAssetFromApi[], previousCursor: number): number | undefined {
    const times = assets
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
    return oldest < previousCursor ? oldest : undefined;
}

/** Whether another older page may exist after this one. */
export function hasOlderCreationsPage(assets: GeneratedAssetFromApi[], nextCursor: number | undefined): boolean {
    return nextCursor !== undefined && assets.length >= CREATIONS_PAGE_SIZE;
}

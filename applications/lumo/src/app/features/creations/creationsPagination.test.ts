import type { GeneratedAssetFromApi } from '../../remote/api';
import { CREATIONS_PAGE_SIZE, getOlderPageCursor, hasOlderCreationsPage } from './creationsPagination';

const asset = (createTime: string): GeneratedAssetFromApi => {
    return { ID: createTime, SpaceID: 'space', AssetTag: createTime, CreateTime: createTime };
};

const seconds = (iso: string) => {
    return Math.floor(new Date(iso).getTime() / 1000);
};

describe('creations pagination', () => {
    const cursor = seconds('2026-10-01T00:00:00Z');

    it('moves the cursor to the oldest raw asset, even if every asset is later filtered out', () => {
        const page = [asset('2026-09-20T10:00:00Z'), asset('2026-09-10T08:00:00Z')];
        expect(getOlderPageCursor(page, cursor)).toBe(seconds('2026-09-10T08:00:00Z'));
    });

    it('stops when the page is empty or the cursor would not move', () => {
        expect(getOlderPageCursor([], cursor)).toBeUndefined();
        expect(getOlderPageCursor([asset('2026-10-01T00:00:00Z')], cursor)).toBeUndefined();
    });

    it('only expects another page after a full one that moved the cursor', () => {
        const fullPage = Array.from({ length: CREATIONS_PAGE_SIZE }, (_, index) => {
            return asset(`2026-09-${String(index + 1).padStart(2, '0')}T00:00:00Z`);
        });
        expect(hasOlderCreationsPage(fullPage, getOlderPageCursor(fullPage, cursor))).toBe(true);
        expect(hasOlderCreationsPage(fullPage.slice(1), getOlderPageCursor(fullPage.slice(1), cursor))).toBe(false);
        expect(hasOlderCreationsPage(fullPage, undefined)).toBe(false);
    });
});

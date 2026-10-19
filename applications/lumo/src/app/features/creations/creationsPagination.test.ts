import type { GeneratedAssetFromApi } from '../../remote/api';
import { CREATIONS_LIST_PAGE_SIZE, getNextCreationsListUntil } from './creationsPagination';

const asset = (id: string, createTime: string): GeneratedAssetFromApi => {
    return { ID: id, SpaceID: 'space', AssetTag: id, CreateTime: createTime };
};

const seconds = (iso: string) => {
    return Math.floor(new Date(iso).getTime() / 1000);
};

const fullPage = (times: (index: number) => string) => {
    return Array.from({ length: CREATIONS_LIST_PAGE_SIZE }, (_, index) => {
        return asset(`asset-${index}`, times(index));
    });
};

describe('getNextCreationsListUntil', () => {
    const until = seconds('2026-10-14T12:00:00Z');

    it('is done after a page that is not full', () => {
        expect(getNextCreationsListUntil([], until)).toBeUndefined();
        expect(getNextCreationsListUntil([asset('a', '2026-10-01T00:00:00Z')], until)).toBeUndefined();
    });

    it('continues from the oldest second of a full page, inclusive, so the rest of that second is not skipped', () => {
        const page = fullPage((index) => {
            return new Date(seconds('2026-10-10T00:00:00Z') * 1000 - index * 60_000).toISOString();
        });
        const oldest = seconds(page[page.length - 1].CreateTime);
        expect(getNextCreationsListUntil(page, until)).toBe(oldest);
    });

    it('steps back one second when a whole full page shares the cursor second, so the walk ends', () => {
        const sameSecond = new Date(until * 1000).toISOString();
        const page = fullPage(() => {
            return sameSecond;
        });
        expect(getNextCreationsListUntil(page, until)).toBe(until - 1);
    });

    it('always moves the cursor back', () => {
        const page = fullPage((index) => {
            return new Date((until - 1000 + index) * 1000).toISOString();
        });
        const next = getNextCreationsListUntil(page, until);
        expect(next).toBeDefined();
        expect(next!).toBeLessThan(until);
    });
});

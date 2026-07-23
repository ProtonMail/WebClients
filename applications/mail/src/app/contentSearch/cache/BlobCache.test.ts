import type { Cached } from '@proton/proton-foundation-search';

import { BlobCache } from './BlobCache';

// `Cached` is a wasm handle; the cache only ever calls `.free()` on it, so a jest.fn is enough.
type FakeCached = { free: jest.Mock };
const fakeCached = (): FakeCached => ({ free: jest.fn() });
const asCached = (c: FakeCached) => c as unknown as Cached;

describe('BlobCache', () => {
    it('stores and retrieves a blob by id, and returns undefined for an unknown id', () => {
        const cache = new BlobCache();
        const blob = fakeCached();

        cache.set('a', asCached(blob));

        expect(cache.get('a')).toBe(blob);
        expect(cache.get('missing')).toBeUndefined();
    });

    it('frees the previous handle when an id is overwritten, and keeps the new one', () => {
        const cache = new BlobCache();
        const first = fakeCached();
        const second = fakeCached();

        cache.set('a', asCached(first));
        cache.set('a', asCached(second));

        expect(first.free).toHaveBeenCalledTimes(1);
        expect(second.free).not.toHaveBeenCalled();
        expect(cache.get('a')).toBe(second);
    });

    it('does not free anything when setting a new, distinct id', () => {
        const cache = new BlobCache();
        const first = fakeCached();
        const second = fakeCached();

        cache.set('a', asCached(first));
        cache.set('b', asCached(second));

        expect(first.free).not.toHaveBeenCalled();
        expect(second.free).not.toHaveBeenCalled();
    });

    it('delete frees the handle and removes it', () => {
        const cache = new BlobCache();
        const blob = fakeCached();

        cache.set('a', asCached(blob));
        cache.delete('a');

        expect(blob.free).toHaveBeenCalledTimes(1);
        expect(cache.get('a')).toBeUndefined();
    });

    it('delete of an unknown id is a no-op and leaves other entries untouched', () => {
        const cache = new BlobCache();
        const blob = fakeCached();
        cache.set('a', asCached(blob));

        expect(() => cache.delete('missing')).not.toThrow();
        expect(blob.free).not.toHaveBeenCalled();
        expect(cache.get('a')).toBe(blob);
    });

    it('free releases every stored handle exactly once', () => {
        const cache = new BlobCache();
        const first = fakeCached();
        const second = fakeCached();
        cache.set('a', asCached(first));
        cache.set('b', asCached(second));

        cache.free();

        expect(first.free).toHaveBeenCalledTimes(1);
        expect(second.free).toHaveBeenCalledTimes(1);
    });
});

import { createSharedWorkerName, parseSharedWorkerName } from './sharedWorkerName';
import type { UserId } from './types';

describe('sharedWorkerName', () => {
    it('round-trips appVersion and userId through create/parse', () => {
        const name = createSharedWorkerName({ appVersion: '2.0.0', userId: 'user-123' as UserId });
        expect(parseSharedWorkerName(name)).toEqual({ appVersion: '2.0.0', userId: 'user-123' });
    });

    it('builds the expected name format', () => {
        const name = createSharedWorkerName({ appVersion: '5.2.0+abcdefgh', userId: 'user-1' as UserId });
        expect(name).toBe('drive-search-worker/5.2.0+abcdefgh/user-1');
    });

    it('throws on a name with the wrong prefix', () => {
        expect(() => parseSharedWorkerName('other-worker/1.0.0/user-1')).toThrow();
    });

    it('throws on a name missing segments', () => {
        expect(() => parseSharedWorkerName('drive-search-worker/1.0.0')).toThrow();
    });

    it('throws on a name with extra segments', () => {
        expect(() => parseSharedWorkerName('drive-search-worker/1.0.0/user-1/extra')).toThrow();
    });

    it('throws on an empty userId segment', () => {
        expect(() => parseSharedWorkerName('drive-search-worker/1.0.0/')).toThrow();
    });
});

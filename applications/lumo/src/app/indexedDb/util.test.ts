import { DbApi } from './db';
import { IndexedDBUnavailableError, getIndexedDB, isIndexedDBAvailable } from './util';

describe('IndexedDB availability helpers', () => {
    // `fake-indexeddb/auto` installs a global indexedDB for the test env. We
    // snapshot and restore it so each test can simulate it being absent (as on
    // iOS Safari with website data blocked, private browsing, or Lockdown Mode).
    const originalIndexedDB = globalThis.indexedDB;

    afterEach(() => {
        Object.defineProperty(globalThis, 'indexedDB', {
            value: originalIndexedDB,
            configurable: true,
            writable: true,
        });
    });

    const removeIndexedDB = () => {
        Object.defineProperty(globalThis, 'indexedDB', {
            value: undefined,
            configurable: true,
            writable: true,
        });
    };

    describe('when IndexedDB is available', () => {
        it('isIndexedDBAvailable returns true', () => {
            expect(isIndexedDBAvailable()).toBe(true);
        });

        it('getIndexedDB returns the global factory', () => {
            expect(getIndexedDB()).toBe(originalIndexedDB);
        });
    });

    describe('when IndexedDB is unavailable', () => {
        beforeEach(removeIndexedDB);

        it('isIndexedDBAvailable returns false', () => {
            expect(isIndexedDBAvailable()).toBe(false);
        });

        it('getIndexedDB throws a typed IndexedDBUnavailableError', () => {
            expect(() => getIndexedDB()).toThrow(IndexedDBUnavailableError);
        });

        it('the error carries a non-empty, user-facing message', () => {
            try {
                getIndexedDB();
                throw new Error('expected getIndexedDB to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(IndexedDBUnavailableError);
                expect((error as IndexedDBUnavailableError).message.length).toBeGreaterThan(0);
            }
        });

        it('constructing DbApi fails fast with IndexedDBUnavailableError', () => {
            expect(() => new DbApi('user-id')).toThrow(IndexedDBUnavailableError);
        });
    });
});

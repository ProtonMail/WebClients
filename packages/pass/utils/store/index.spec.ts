import { createMemoryStore } from './index';

describe('createMemoryStore', () => {
    test('should get/set values', () => {
        const store = createMemoryStore();
        store.set('key', 'value');
        expect(store.get('key')).toBe('value');
    });

    test('should return `undefined` for missing keys', () => {
        const store = createMemoryStore();
        expect(store.get('missing')).toBeUndefined();
    });

    test('should reset all values', () => {
        const store = createMemoryStore();
        store.set('a', 1);
        store.set('b', 2);
        store.reset();
        expect(store.get('a')).toBeUndefined();
        expect(store.get('b')).toBeUndefined();
    });

    test('should coalesce synchronous `set()` calls into a single notification', async () => {
        const store = createMemoryStore();
        const spy = jest.fn();
        store.subscribe(spy);

        store.set('a', 1);
        store.set('b', 2);
        store.set('c', 3);

        expect(spy).not.toHaveBeenCalled();
        await Promise.resolve();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should notify again on the next synchronous batch', async () => {
        const store = createMemoryStore();
        const spy = jest.fn();
        store.subscribe(spy);

        store.set('a', 1);
        store.set('b', 2);
        await Promise.resolve();
        expect(spy).toHaveBeenCalledTimes(1);

        store.set('c', 3);
        await Promise.resolve();
        expect(spy).toHaveBeenCalledTimes(2);
    });

    test('should unsubscribe', async () => {
        const store = createMemoryStore();
        const spy = jest.fn();
        const unsubscribe = store.subscribe(spy);

        store.set('a', 1);
        unsubscribe();
        await Promise.resolve();
        expect(spy).not.toHaveBeenCalled();
    });
});

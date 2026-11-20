import { vi } from 'vitest';

const mockStorage = new Map<string, any>();

const mockStore = {
    name: 'mock-store',
    toString: () => 'mock-store',
};

const createStore = vi.fn(() => mockStore);

const get = vi.fn((key) => {
    return Promise.resolve(mockStorage.get(key));
});

const set = vi.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
});

const del = vi.fn((key) => {
    mockStorage.delete(key);
    return Promise.resolve();
});

const clear = vi.fn(() => {
    mockStorage.clear();
    return Promise.resolve();
});

const getMany = vi.fn((keys) => {
    return Promise.resolve(keys.map((key: string) => mockStorage.get(key)));
});

const setMany = vi.fn((entries) => {
    entries.forEach(([key, value]: [string, any]) => mockStorage.set(key, value));
    return Promise.resolve();
});

const delMany = vi.fn((keys) => {
    keys.forEach((key: string) => mockStorage.delete(key));
    return Promise.resolve();
});

// eslint-disable-next-line
const __resetMockStorage = () => {
    mockStorage.clear();
    get.mockClear();
    set.mockClear();
    del.mockClear();
    clear.mockClear();
    getMany.mockClear();
    setMany.mockClear();
    delMany.mockClear();
    createStore.mockClear();
};

const keys = vi.fn(() => {
    return Promise.resolve(Array.from(mockStorage.keys()));
});

const values = vi.fn(() => {
    return Promise.resolve(Array.from(mockStorage.values()));
});

const entries = vi.fn(() => {
    return Promise.resolve(Array.from(mockStorage.entries()));
});

export { get, set, del, clear, getMany, setMany, delMany, keys, values, entries, createStore, __resetMockStorage };

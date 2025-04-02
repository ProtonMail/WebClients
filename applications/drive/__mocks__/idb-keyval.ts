const mockStorage = new Map<string, any>();

const mockStore = {
    name: 'mock-store',
    toString: () => 'mock-store',
};

const createStore = jest.fn(() => mockStore);

const get = jest.fn((key) => {
    return Promise.resolve(mockStorage.get(key));
});

const set = jest.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
});

const del = jest.fn((key) => {
    mockStorage.delete(key);
    return Promise.resolve();
});

const clear = jest.fn(() => {
    mockStorage.clear();
    return Promise.resolve();
});

const getMany = jest.fn((keys) => {
    return Promise.resolve(keys.map((key: string) => mockStorage.get(key)));
});

const setMany = jest.fn((entries) => {
    entries.forEach(([key, value]: [string, any]) => mockStorage.set(key, value));
    return Promise.resolve();
});

const delMany = jest.fn((keys) => {
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

const keys = jest.fn(() => {
    return Promise.resolve(Array.from(mockStorage.keys()));
});

const values = jest.fn(() => {
    return Promise.resolve(Array.from(mockStorage.values()));
});

const entries = jest.fn(() => {
    return Promise.resolve(Array.from(mockStorage.entries()));
});

module.exports = {
    get,
    set,
    del,
    clear,
    getMany,
    setMany,
    delMany,
    keys,
    values,
    entries,
    createStore,
    __resetMockStorage,
};

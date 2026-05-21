export const createEmptyAsyncGenerator = <T>(): AsyncGenerator<T> =>
    (async function* emptyGenerator() {
        yield* [] as T[];
    })();

export type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

export const createDeferred = <T>(): Deferred<T> => {
    let resolve!: Deferred<T>['resolve'];
    let reject!: Deferred<T>['reject'];
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

export const flushAsync = async (iterations = 1) => {
    for (let i = 0; i < iterations; i += 1) {
        await Promise.resolve();
    }
};

export const waitForCondition = async (predicate: () => boolean, iterations = 10) => {
    for (let i = 0; i < iterations; i += 1) {
        if (predicate()) {
            return;
        }
        await flushAsync();
    }
    throw new Error('Condition not met within allotted iterations');
};

export const trackInstances = <Args extends unknown[], Instance>(factory: (...args: Args) => Instance) => {
    let currentFactory = factory;
    const instances: Instance[] = [];
    const Mock = jest.fn((...args: Args) => {
        const instance = currentFactory(...args);
        instances.push(instance);
        return instance;
    });
    return {
        Mock,
        instances,
        setFactory(newFactory: (...args: Args) => Instance) {
            currentFactory = newFactory;
        },
        restoreFactory() {
            currentFactory = factory;
        },
        reset(resetFactory = true) {
            if (resetFactory) {
                currentFactory = factory;
            }
            instances.length = 0;
            Mock.mockClear();
        },
    };
};

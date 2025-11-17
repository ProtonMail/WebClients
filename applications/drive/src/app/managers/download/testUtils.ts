import type { MemberRole, NodeEntity, NodeType, RevisionState } from '@proton/drive';

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

const DEFAULT_MEMBER_ROLE: MemberRole = 'admin' as MemberRole;
const DEFAULT_NODE_TYPE: NodeType = 'file' as NodeType;
const DEFAULT_REVISION_STATE: RevisionState = 'active' as RevisionState;

export const createMockNodeEntity = (overrides: Partial<NodeEntity> = {}): NodeEntity => ({
    uid: 'node-uid',
    parentUid: undefined,
    name: 'mock-file.txt',
    keyAuthor: {
        ok: true,
        value: 'key-author',
    },
    nameAuthor: {
        ok: true,
        value: 'name-author',
    },
    directRole: DEFAULT_MEMBER_ROLE,
    type: DEFAULT_NODE_TYPE,
    mediaType: 'application/octet-stream',
    isShared: false,
    isSharedPublicly: false,
    creationTime: new Date('2024-01-01T00:00:00Z'),
    trashTime: undefined,
    totalStorageSize: 0,
    activeRevision: {
        uid: 'revision-uid',
        state: DEFAULT_REVISION_STATE,
        creationTime: new Date('2024-01-01T00:00:00Z'),
        contentAuthor: {
            ok: true,
            value: 'content-author',
        },
        storageSize: 1024,
    },
    folder: undefined,
    treeEventScopeId: 'tree-scope-id',
    ...overrides,
});

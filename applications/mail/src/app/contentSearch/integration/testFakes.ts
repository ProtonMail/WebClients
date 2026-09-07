import type { ESSettledState } from '@proton/encrypted-search/models';

import type { ImportHandle, ImportOutcome } from '../import/ImportHandle';
import type { IndexService } from '../indexation/IndexService';
import type { ESStatusConcrete } from './ESAdapter';
import type { FunctionsV1 } from './useContentSearch';

/** Lets a test resolve a promise the code under test is waiting on. */
export const deferred = <T>() => {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

/** Lets pending promise callbacks run, so assertions see the state the code under test settled on. */
export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * The parts of {@link ImportHandle} an {@link IndexingJob} touches: progress to mirror, and an
 * outcome that ends the job.
 */
export const fakeImportHandle = () => {
    const done = deferred<ImportOutcome>();
    const handle = {
        done: done.promise,
        onProgress: { subscribe: () => () => {} },
        stop: jest.fn(),
        total: 10,
        completed: 0,
        progress: 0,
        remainingMinutes: 0,
    };
    return { handle: handle as unknown as ImportHandle, end: done.resolve };
};

/** An {@link IndexService} that hands out one controllable import. */
export const fakeIndexService = (importHandle?: ImportHandle) =>
    ({
        handleEvent: jest.fn().mockResolvedValue(false),
        importFromEncryptedSearch: jest.fn().mockResolvedValue(importHandle),
        deleteIndex: jest.fn().mockResolvedValue(undefined),
    }) as unknown as IndexService;

export const fakeV1Status = (overrides: Partial<ESStatusConcrete> = {}): ESStatusConcrete =>
    ({
        dbExists: true,
        esEnabled: true,
        contentIndexingDone: true,
        isEnablingContentSearch: false,
        isContentIndexingPaused: false,
        ...overrides,
    }) as ESStatusConcrete;

/**
 * A v1 instance whose startup a test drives: `settle` reports what the checks concluded (as the real
 * `initializeES` does before it returns), `end` resolves the call itself.
 */
export const fakeV1Functions = () => {
    const startup = deferred<void>();
    let report: ((state: ESSettledState) => void) | undefined;

    const functions = {
        initializeES: jest.fn((options?: { onStateSettled?: (state: ESSettledState) => void }) => {
            report = options?.onStateSettled;
            return startup.promise;
        }),
        esDelete: jest.fn().mockResolvedValue(undefined),
        handleEvent: jest.fn().mockResolvedValue(undefined),
        waitForSyncing: jest.fn().mockResolvedValue(undefined),
        esStatus: fakeV1Status(),
    } as unknown as FunctionsV1;

    return {
        functions,
        settle: (state: Partial<ESSettledState> = {}) =>
            report?.({ dbExists: true, esEnabled: true, contentIndexingDone: true, ...state }),
        end: startup.resolve,
        fail: startup.reject,
    };
};

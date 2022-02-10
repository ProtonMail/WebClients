import retryOnError from './retryOnError';

const errorMessage = 'STRI-I-I-I-I-I-ING';

describe('retryOnError', () => {
    let throwingFunction: () => Promise<void>;
    let throwingFunction2: () => Promise<void>;

    beforeEach(() => {
        throwingFunction = jest.fn().mockImplementation(() => {
            throw new Error(errorMessage);
        });
        throwingFunction2 = jest.fn().mockImplementation(() => {
            throw new Error(errorMessage);
        });
    });

    it("runs main function once if there's no error", () => {
        const runFunction = jest.fn();

        void retryOnError({
            fn: runFunction,
            shouldRetryBasedOnError: () => true,
            maxRetriesNumber: 1000,
        })();

        expect(runFunction).toBeCalledTimes(1);
    });

    it('retries run function n times', async () => {
        const promise = retryOnError<unknown>({
            fn: throwingFunction,
            shouldRetryBasedOnError: () => true,
            maxRetriesNumber: 1,
        })();

        await expect(promise).rejects.toThrow();
        expect(throwingFunction).toBeCalledTimes(2);
        expect(retryOnError).toThrow();
    });

    it('validates incoming error', async () => {
        const promise = retryOnError<unknown>({
            fn: throwingFunction,
            shouldRetryBasedOnError: (error: unknown) => {
                return (error as Error).message === errorMessage;
            },
            maxRetriesNumber: 1,
        })();
        await expect(promise).rejects.toThrow();
        expect(throwingFunction).toBeCalledTimes(2);

        const promise2 = retryOnError<unknown>({
            fn: throwingFunction2,
            shouldRetryBasedOnError: (error: unknown) => {
                return (error as Error).message === 'another string';
            },
            maxRetriesNumber: 1,
        })();
        expect(throwingFunction2).toBeCalledTimes(1);
        await expect(promise2).rejects.toThrow();
    });

    it('executes preparation function on retry', async () => {
        const preparationFunction = jest.fn();
        const promise = retryOnError<unknown>({
            fn: throwingFunction,
            shouldRetryBasedOnError: (error: unknown) => {
                return (error as Error).message === errorMessage;
            },
            beforeRetryCallback: preparationFunction,
            maxRetriesNumber: 1,
        })();
        expect(preparationFunction).toBeCalledTimes(1);
        await expect(promise).rejects.toThrow();
    });

    it('returns value on successful retry attempt', async () => {
        const returnValue = Symbol('returnValue');
        let execCount = 0;
        const runFunc = jest.fn().mockImplementation(() => {
            if (execCount > 1) {
                return Promise.resolve(returnValue);
            }
            execCount++;
            throw new Error();
        });

        const result = await retryOnError<unknown>({
            fn: runFunc,
            shouldRetryBasedOnError: () => true,
            maxRetriesNumber: 2,
        })().catch(() => {});

        expect(result).toBe(returnValue);
    });
});

import { useCache } from '@proton/components';
import noop from '@proton/utils/noop';

type CacheValue = {
    promise: Promise<any>;
    controller: AbortController;
    signals: (AbortSignal | undefined)[];
    numberOfCallers: number;
    error?: any;
};

export default function useDebouncedFunction() {
    const cache = useCache<string, CacheValue>();

    /**
     * Return already existing promise for the same call.
     *
     * In the case two callers depend on the same promise, the promise is
     * aborted only when all signals are aborted. If one caller does not
     * provide signal, it is never aborted to respect the callers choice.
     */
    const debouncedFunction = <T>(
        callback: (signal: AbortSignal) => Promise<T>,
        args: object,
        originalSignal?: AbortSignal
    ): Promise<T> => {
        const key = `drivedebouncedfn_${JSON.stringify(args)}`;
        const cachedValue = cache.get(key);

        const cleanup = () => {
            cache.delete(key);
        };

        // When signal is aborted, it can take a bit of time before the promise
        // is removed from the cache. Therefore it is better to double check.
        if (cachedValue && !cachedValue.controller.signal.aborted) {
            cachedValue.signals.push(originalSignal);
            cachedValue.numberOfCallers++;
            addAbortListener(cachedValue, originalSignal);
            return propagateErrors(cleanup, cachedValue, originalSignal);
        }

        // @ts-ignore: Missing promise is set on the next line.
        const value: CacheValue = {
            controller: new AbortController(),
            signals: [originalSignal],
            numberOfCallers: 1,
        };

        value.promise = callback(value.controller.signal)
            // Ideally, we could just store the promise and return it everywhere
            // as is--but that stores promise without any catch which is causing
            // unhandled promises in console even though we handle them all.
            // That's why we need to catch the error and add it to the cache
            // instead. To make it work, it is crucial to not cleanup the cache
            // before all promises were returned (because we need to propagate
            // back the original error).
            .catch((err) => {
                value.error = err;
            });

        cache.set(key, value);
        addAbortListener(value, originalSignal);

        return propagateErrors(cleanup, value, originalSignal);
    };

    return debouncedFunction;
}

function addAbortListener(value: CacheValue, originalSignal?: AbortSignal) {
    if (!originalSignal) {
        return;
    }
    const handleAbort = () => {
        const allAborted = !value.signals.some((signal) => !signal || !signal.aborted);
        if (allAborted) {
            value.controller.abort();
        }
    };
    originalSignal.addEventListener('abort', handleAbort);
    value.promise
        .finally(() => {
            originalSignal.removeEventListener('abort', handleAbort);
        })
        .catch(noop);
}

async function propagateErrors<T>(
    cacheCleanup: () => void,
    cachedValue: CacheValue,
    originalSignal?: AbortSignal
): Promise<any> {
    return cachedValue.promise.then((result: T) => {
        // When last caller is served, we can clean the cache.
        cachedValue.numberOfCallers--;
        if (cachedValue.numberOfCallers <= 0) {
            cacheCleanup();
        }
        if (cachedValue.error) {
            throw cachedValue.error;
        }
        // The original signal is wrapped, so the check if aborted error
        // should be propagated needs to be done.
        if (originalSignal?.aborted) {
            // Replace with throw signal.reason once supported by browsers.
            throw new DOMException('Aborted', 'AbortError');
        }
        return result;
    });
}

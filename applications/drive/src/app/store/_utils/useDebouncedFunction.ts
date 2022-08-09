import { useCache } from '@proton/components';

type CacheValue = {
    promise: Promise<any>;
    controller: AbortController;
    signals: (AbortSignal | undefined)[];
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
        signal?: AbortSignal
    ): Promise<T> => {
        const key = `drivedebouncedfn_${JSON.stringify(args)}`;
        const cachedValue = cache.get(key);

        // When signal is aborted, it can take a bit of time before the promise
        // is removed from the cache. Therefore it is better to double check.
        if (cachedValue && !cachedValue.controller.signal.aborted) {
            cachedValue.signals.push(signal);
            addAbortListener(cachedValue, signal);
            return propagateAbortError(cachedValue.promise, signal);
        }

        const controller = new AbortController();
        const promise = callback(controller.signal);

        const value = {
            promise,
            controller,
            signals: [signal],
        };
        cache.set(key, value);
        addAbortListener(value, signal);

        const cleanup = () => {
            cache.delete(key);
        };
        promise.then(cleanup).catch(cleanup);
        return propagateAbortError(promise, signal);
    };

    return debouncedFunction;
}

function addAbortListener(value: CacheValue, signal?: AbortSignal) {
    if (!signal) {
        return;
    }
    const handleAbort = () => {
        const allAborted = !value.signals.some((signal) => !signal || !signal.aborted);
        if (allAborted) {
            value.controller.abort();
        }
    };
    signal.addEventListener('abort', handleAbort);
    value.promise.finally(() => {
        signal.removeEventListener('abort', handleAbort);
    });
}

function propagateAbortError<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
    return promise.then((result: T) => {
        // The original signal is wrapped, so the check if aborted error
        // should be propagated needs to be done.
        if (signal?.aborted) {
            // Replace with throw signal.reason once supported by browsers.
            throw new DOMException('Aborted', 'AbortError');
        }
        return result;
    });
}

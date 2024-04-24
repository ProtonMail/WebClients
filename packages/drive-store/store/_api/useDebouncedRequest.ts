import { useApi } from '@proton/components';

import { useDebouncedFunction } from '../_utils';

export default function useDebouncedRequest() {
    const api = useApi();
    const debouncedFunction = useDebouncedFunction();

    const debouncedRequest = <T>(args: object, abortSignal?: AbortSignal): Promise<T> => {
        return debouncedFunction(
            (signal: AbortSignal) => {
                return api<T>({ signal, ...args });
            },
            args,
            abortSignal
        );
    };

    return debouncedRequest;
}

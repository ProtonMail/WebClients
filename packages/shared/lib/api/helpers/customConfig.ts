import { getUIDHeaderValue, withAuthHeaders, withUIDHeaders } from '@proton/shared/lib/fetch/headers';

import type { Api } from '../../interfaces';

/**
 * @description Use `useSilentApi` hook if using the method in a React component.
 * This function is not stable and could result in infinite render loops.
 *
 * @example
 * ```tsx
 * // ❌ Don't use this
 * const silentApi = getSilentApi(api);
 *
 * // ✅ Use this instead
 * const silentApi = useSilentApi();
 * ```
 */
export const getSilentApi = (api: Api) => {
    return <T>(config: any) => api<T>({ ...config, silence: true });
};

export const getApiWithAbort = (api: Api, signal: AbortSignal) => {
    return <T>(config: any) => api<T>({ ...config, signal });
};

export const getSilentApiWithAbort = (api: Api, signal: AbortSignal) => {
    return <T>(config: any) => api<T>({ ...config, signal, silence: true });
};

export const getUIDApi = (UID: string, api: Api) => {
    return <T>(config: any): Promise<T> => {
        // Note: requestUID !== UID means that this config is already set with a UID, so ignore the original one.
        const requestUID = getUIDHeaderValue(config.headers) ?? UID;
        if (requestUID !== UID) {
            return api(config);
        }
        return api<T>(withUIDHeaders(UID, config));
    };
};

export const getAuthAPI = (UID: string, AccessToken: string, api: Api) => {
    return <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));
};

import { Api } from '../../interfaces';

export const getSilentApi = (api: Api) => {
    return <T>(config: any) => api<T>({ ...config, silence: true });
};

export const getApiWithAbort = (api: Api, signal: AbortSignal) => {
    return <T>(config: any) => api<T>({ ...config, signal });
};

export const getSilentApiWithAbort = (api: Api, signal: AbortSignal) => {
    return <T>(config: any) => api<T>({ ...config, signal, silence: true  });
};

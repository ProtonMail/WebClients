import { getUIDHeaders } from '@proton/shared/lib/fetch/headers';

export interface IMetricsApi {
    setAuthHeaders: (uid: string) => void;
    fetch: (requestInfo: RequestInfo | URL, requestInit?: RequestInit) => Promise<Response>;
}

class MetricsApi implements IMetricsApi {
    private _authHeaders: { [key: string]: string };

    constructor(uid?: string) {
        this._authHeaders = this.getAuthHeaders(uid);
    }

    private getAuthHeaders(uid?: string) {
        if (uid) {
            return getUIDHeaders(uid);
        } else {
            return {};
        }
    }

    public setAuthHeaders(uid: string) {
        this._authHeaders = this.getAuthHeaders(uid);
    }

    public fetch(requestInfo: RequestInfo | URL, requestInit?: RequestInit) {
        return window.fetch(requestInfo, {
            ...requestInit,
            headers: {
                ...requestInit?.headers,
                'content-type': 'application/json',
                ...this._authHeaders,
            },
        });
    }
}

export default MetricsApi;

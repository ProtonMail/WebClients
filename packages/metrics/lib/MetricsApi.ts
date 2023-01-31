import { getAppVersionHeaders, getUIDHeaders } from '@proton/shared/lib/fetch/headers';

export interface IMetricsApi {
    setAuthHeaders: (uid: string) => void;
    setVersionHeaders: (clientID: string, appVersion: string) => void;
    fetch: (requestInfo: RequestInfo | URL, requestInit?: RequestInit) => Promise<Response>;
}

class MetricsApi implements IMetricsApi {
    private _authHeaders: { [key: string]: string };

    private _versionHeaders: { [key: string]: string };

    constructor({ uid, clientID, appVersion }: { uid?: string; clientID?: string; appVersion?: string } = {}) {
        this._authHeaders = this.getAuthHeaders(uid);
        this._versionHeaders = this.getVersionHeaders(clientID, appVersion);
    }

    public setAuthHeaders(uid: string) {
        this._authHeaders = this.getAuthHeaders(uid);
    }

    public setVersionHeaders(clientID: string, appVersion: string) {
        this._versionHeaders = this.getVersionHeaders(clientID, appVersion);
    }

    public fetch(requestInfo: RequestInfo | URL, requestInit?: RequestInit) {
        return fetch(requestInfo, {
            ...requestInit,
            headers: {
                ...requestInit?.headers,
                'content-type': 'application/json',
                ...this._authHeaders,
                ...this._versionHeaders,
            },
        });
    }

    private getAuthHeaders(uid?: string) {
        if (!uid) {
            return {};
        }

        return getUIDHeaders(uid);
    }

    private getVersionHeaders(clientID?: string, appVersion?: string) {
        if (!clientID || !appVersion) {
            return {};
        }

        return getAppVersionHeaders(clientID, appVersion);
    }
}

export default MetricsApi;

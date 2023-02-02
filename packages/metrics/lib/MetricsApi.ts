import { HTTP_STATUS_CODE, SECOND } from '@proton/shared/lib/constants';
import { getAppVersionHeaders, getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { wait } from '@proton/shared/lib/helpers/promise';

import { METRICS_DEFAULT_RETRY_SECONDS, METRICS_MAX_ATTEMPTS } from './../constants';

export interface IMetricsApi {
    setAuthHeaders: (uid: string) => void;
    setVersionHeaders: (clientID: string, appVersion: string) => void;
    fetch: (requestInfo: RequestInfo | URL, requestInit?: RequestInit, retries?: number) => Promise<Response | void>;
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

    public async fetch(
        requestInfo: RequestInfo | URL,
        requestInit?: RequestInit,
        attempt: number = 1
    ): Promise<Response | undefined> {
        const response = await fetch(requestInfo, {
            ...requestInit,
            headers: {
                ...requestInit?.headers,
                'content-type': 'application/json',
                ...this._authHeaders,
                ...this._versionHeaders,
            },
        });

        if (attempt >= METRICS_MAX_ATTEMPTS) {
            return;
        }

        if (response.status === HTTP_STATUS_CODE.TOO_MANY_REQUESTS) {
            const retryAfterSeconds = (() => {
                const retryHeader = response?.headers?.get('retry-after') || '';

                const parsedInt = parseInt(retryHeader, 10);

                if (parsedInt <= 0 || isNaN(parsedInt)) {
                    return METRICS_DEFAULT_RETRY_SECONDS;
                }

                return parsedInt;
            })();

            await wait(retryAfterSeconds * SECOND);

            return this.fetch(requestInfo, requestInit, attempt + 1);
        }

        return response;
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

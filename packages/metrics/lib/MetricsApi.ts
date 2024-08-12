import { HTTP_STATUS_CODE, SECOND } from '@proton/shared/lib/constants';
import { getAppVersionHeaders, getAuthHeaders, getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { wait } from '@proton/shared/lib/helpers/promise';

import { METRICS_DEFAULT_RETRY_SECONDS, METRICS_MAX_ATTEMPTS, METRICS_REQUEST_TIMEOUT_SECONDS } from './../constants';
import type IMetricsApi from './types/IMetricsApi';

class MetricsApi implements IMetricsApi {
    private _authHeaders: { [key: string]: string };

    private _versionHeaders: { [key: string]: string };

    constructor({ uid, clientID, appVersion }: { uid?: string; clientID?: string; appVersion?: string } = {}) {
        this._authHeaders = this.getAuthHeaders(uid);
        this._versionHeaders = this.getVersionHeaders(clientID, appVersion);
    }

    public setAuthHeaders(uid: string, accessToken?: string) {
        this._authHeaders = this.getAuthHeaders(uid, accessToken);
    }

    public setVersionHeaders(clientID: string, appVersion: string) {
        this._versionHeaders = this.getVersionHeaders(clientID, appVersion);
    }

    private async _fetchWithTimeout(requestInfo: RequestInfo | URL, requestInit: RequestInit) {
        const abortController = new AbortController();

        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, METRICS_REQUEST_TIMEOUT_SECONDS * SECOND);

        return fetch(requestInfo, {
            signal: abortController.signal,
            ...requestInit,
        }).finally(() => {
            clearTimeout(timeoutId);
        });
    }

    public async fetch(
        requestInfo: RequestInfo | URL,
        requestInit: RequestInit = {},
        attempt: number = 1
    ): Promise<Response | undefined> {
        try {
            const response = await this._fetchWithTimeout(requestInfo, {
                ...requestInit,
                headers: {
                    ...requestInit?.headers,
                    'content-type': 'application/json',
                    priority: 'u=6',
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
                return await this.fetch(requestInfo, requestInit, attempt + 1);
            }

            return response;
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                throw error;
            }

            if (attempt >= METRICS_MAX_ATTEMPTS) {
                return;
            }

            await wait(METRICS_DEFAULT_RETRY_SECONDS * SECOND);
            return this.fetch(requestInfo, requestInit, attempt + 1);
        }
    }

    private getAuthHeaders(uid?: string, accessToken?: string) {
        if (!uid) {
            return {};
        }

        if (uid && accessToken) {
            return getAuthHeaders(uid, accessToken);
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

import { createErrorHandler } from '@proton/mail/helpers/dom';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getAppVersionHeaders, getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { serializeData } from '@proton/shared/lib/fetch/serialize';
import createListeners from '@proton/shared/lib/helpers/listeners';

import config from '../config';

export type HTTPHeaders = { [key: string]: string };

export enum HTTP_METHODS {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
}

export enum HTTP_INPUTS {
    FORM_DATA = 'form',
}

export interface RequestParams {
    method: HTTP_METHODS;
    url: string;
    input: HTTP_INPUTS;
    data: { [key: string]: Blob | string | undefined };
}

const clientID = getClientID(config.APP_NAME);
const appVersionHeaders = getAppVersionHeaders(clientID, config.APP_VERSION);

const defaultHeaders: HTTPHeaders = {
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/vnd.protonmail.v1+json',
    ...appVersionHeaders,
};

export interface Upload<T> {
    /**
     * Open reference to the actual XHR, but other fields should be more practical
     */
    xhr: XMLHttpRequest;

    /**
     * Add listener to the upload progress events
     */
    addProgressListener: (listener: (event: ProgressEvent) => void) => void;

    /**
     * Executing ths function will abort the current upload
     */
    abort: () => void;

    /**
     * Promise resolved at the end of the upload and containing the JSON content returned by the server
     */
    resultPromise: Promise<T>;
}

export const upload = <T>(uid: string, paramsPromise: RequestParams | Promise<RequestParams>): Upload<T> => {
    const xhr = new XMLHttpRequest();
    const { notify, subscribe } = createListeners<[ProgressEvent], void>();
    const authHeaders = getUIDHeaders(uid) as HTTPHeaders;

    const asyncResolution = async () => {
        const params = await paramsPromise;
        const { body, headers: dataHeaders = {} } = serializeData(params.data, params.input) as {
            body: any;
            headers?: HTTPHeaders;
        };
        const headers = {
            ...defaultHeaders,
            ...dataHeaders,
            ...authHeaders,
        };
        await new Promise<XMLHttpRequest>((resolve, reject) => {
            xhr.upload.onprogress = notify;
            xhr.onload = resolve as any;
            xhr.upload.onerror = createErrorHandler(reject);
            xhr.onerror = createErrorHandler(reject);
            xhr.open(params.method, `${config.API_URL}/${params.url}`);
            xhr.withCredentials = true;
            Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));
            xhr.send(body);
        });
        return JSON.parse(xhr.responseText);
    };

    return {
        xhr,
        addProgressListener: subscribe,
        abort: () => xhr.abort(),
        resultPromise: asyncResolution(),
    };
};

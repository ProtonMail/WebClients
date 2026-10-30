import { createErrorHandler } from '@proton/mail-message/helpers/dom';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getAppVersionHeaders, getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { serializeData } from '@proton/shared/lib/fetch/serialize';
import createListeners from '@proton/shared/lib/helpers/listeners';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';

import type { Upload } from '../attachments/uploadTypes';

type HTTPHeaders = { [key: string]: string };

enum HTTP_METHODS {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
}

enum HTTP_INPUTS {
    FORM_DATA = 'form',
}

export interface RequestParams {
    method: HTTP_METHODS;
    url: string;
    input: HTTP_INPUTS;
    data: { [key: string]: Blob | string | undefined };
}

export type UploadConfig = Pick<ProtonConfig, 'API_URL' | 'APP_NAME' | 'APP_VERSION'>;

const getDefaultHeaders = (config: UploadConfig): HTTPHeaders => ({
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/vnd.protonmail.v1+json',
    ...getAppVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION),
});

export const upload = <T>(
    uid: string,
    paramsPromise: RequestParams | Promise<RequestParams>,
    config: UploadConfig
): Upload<T> => {
    const xhr = new XMLHttpRequest();
    const defaultHeaders = getDefaultHeaders(config);
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

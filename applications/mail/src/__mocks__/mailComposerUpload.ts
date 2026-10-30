import type { Upload } from '@proton/mail-composer/attachments/uploadTypes';
import type { RequestParams } from '@proton/mail-composer/helpers/upload';

import { api } from '../app/helpers/tests/api';

export const upload = <T>(uid: string, paramsPromise: RequestParams | Promise<RequestParams>): Upload<T> => {
    const asyncResolution = async () => {
        const params = await paramsPromise;
        return api(params);
    };

    return {
        xhr: {} as XMLHttpRequest,
        addProgressListener: jest.fn(),
        abort: jest.fn(),
        resultPromise: asyncResolution() as Promise<T>,
    };
};

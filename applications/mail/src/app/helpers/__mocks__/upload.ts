import { RequestParams, Upload } from '../upload';

export const upload = <T>(uid: string, paramsPromise: RequestParams | Promise<RequestParams>): Upload<T> => {
    const asyncResolution = async () => {
        await paramsPromise;
        return {};
    };

    return {
        xhr: {} as XMLHttpRequest,
        addProgressListener: jest.fn(),
        abort: jest.fn(),
        resultPromise: asyncResolution() as Promise<T>
    };
};

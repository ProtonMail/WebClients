import { InactiveSessionError } from '../../lib/api/helpers/errors';
import { withApiHandlers } from '../../lib/api/helpers/withApiHandlers';
import { ApiError } from '../../lib/fetch/ApiError';
import { withUIDHeaders } from '../../lib/fetch/headers';

const getApiError = ({
    data,
    message,
    response,
    status,
}: {
    data?: any;
    message?: string;
    response?: Response;
    status: number;
}) => {
    const error = new ApiError(message || '', status, 'ApiError');
    error.data = data || undefined;
    error.response = response;
    return error;
};

const getApiResult = (result: any) => {
    return {
        headers: {
            get: () => '',
        },
        status: 200,
        json: () => result,
    };
};

describe('auth handlers', () => {
    const withApiHandlersDefaultParams = {
        call: jasmine.createSpy('call'),
        onMissingScopes: jasmine.createSpy('onMissingScopes'),
        onVerification: jasmine.createSpy('onVerification'),
        onUserRestricted: jasmine.createSpy('onUserRestricted'),
    };

    it('should unlock', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(Promise.reject(getApiError({ status: 403 })), Promise.resolve(getApiResult('123')));
        const handleMissingScopes = jasmine.createSpy('unlock').and.callFake(({ options }) => {
            return call(options);
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call, onMissingScopes: handleMissingScopes });
        const result = await api({}).then((r: any) => r.json());
        expect(result).toBe('123');
        expect(handleMissingScopes).toHaveBeenCalledTimes(1);
        expect(call).toHaveBeenCalledTimes(2);
    });

    it('should unlock and be cancellable', async () => {
        const unlockError = getApiError({ status: 403 });
        const call = jasmine.createSpy('call').and.returnValues(Promise.reject(unlockError));
        const handleUnlock = jasmine.createSpy('unlock').and.returnValues(Promise.reject(unlockError));
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            return e;
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call, onMissingScopes: handleUnlock });
        const error = await api({}).catch(handleError);
        expect(error).toBe(unlockError);
        expect(handleError).toHaveBeenCalledTimes(1);
        expect(handleUnlock).toHaveBeenCalledTimes(1);
        expect(call).toHaveBeenCalledTimes(1);
    });

    it('should retry 429 status', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(Promise.reject(getApiError({ status: 429 })), Promise.resolve(getApiResult('123')));
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            return e;
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        const result = await api({})
            .then((r: any) => r.json())
            .catch(handleError);
        expect(result).toBe('123');
        expect(call).toHaveBeenCalledTimes(2);
        expect(handleError).toHaveBeenCalledTimes(0);
    });

    it('should not retry 429 status if disabled', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(Promise.reject(getApiError({ status: 429 })), Promise.resolve(getApiResult('123')));
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            return e;
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        const error = await api({ ignoreHandler: [429] }).catch(handleError);
        expect(error.status).toBe(429);
        expect(call).toHaveBeenCalledTimes(1);
        expect(handleError).toHaveBeenCalledTimes(1);
    });

    it('should retry maximum 5 times', async () => {
        const returns = [
            () => Promise.reject(getApiError({ status: 429 })),
            () => Promise.reject(getApiError({ status: 429 })),
            () => Promise.reject(getApiError({ status: 429 })),
            () => Promise.reject(getApiError({ status: 429 })),
            () => Promise.reject(getApiError({ status: 429 })),
        ];
        let i = 0;
        const call = jasmine.createSpy('call').and.callFake(() => returns[i++]());
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            return e;
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        const error = await api({}).catch(handleError);
        expect(error.status).toBe(429);
        expect(call).toHaveBeenCalledTimes(5);
        expect(handleError).toHaveBeenCalledTimes(1);
    });

    it('should not handle retry when its greater than 10', async () => {
        const response = { headers: { get: () => '10' } } as unknown as Response;
        const call = jasmine.createSpy('call').and.returnValues(Promise.reject(getApiError({ status: 429, response })));
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            return e;
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        const error = await api({}).catch(handleError);
        expect(error.status).toBe(429);
        expect(call).toHaveBeenCalledTimes(1);
        expect(handleError).toHaveBeenCalledTimes(1);
    });

    it('should not refresh if has no session', async () => {
        const call = jasmine.createSpy('call').and.returnValues(Promise.reject(getApiError({ status: 401 })));
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            return e;
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        const error = await api({}).catch(handleError);
        expect(error.status).toBe(401);
        expect(call).toHaveBeenCalledTimes(1);
        expect(handleError).toHaveBeenCalledTimes(1);
    });

    it('should refresh once (if has session)', async () => {
        let refreshed = false;
        let refreshCalls = 0;
        const call = jasmine.createSpy('call').and.callFake(async (args) => {
            if (args.url === 'auth/refresh') {
                refreshed = true;
                refreshCalls++;
                return {
                    headers: { get: () => '1' },
                };
            }
            if (!refreshed) {
                throw getApiError({ status: 401 });
            }
            return args;
        });
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            return e;
        });
        const apiWithHandlers = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        (apiWithHandlers as any).UID = '123';
        const api = (a: any) => apiWithHandlers(a).catch(handleError);
        const result = await Promise.all([api(123), api(231), api(321)]);
        expect(result).toEqual([123, 231, 321]);
        expect(call).toHaveBeenCalledTimes(7);
        expect(handleError).toHaveBeenCalledTimes(0);
        expect(refreshCalls).toBe(1);
    });

    it('should refresh once and fail all active calls (if has session)', async () => {
        const call = jasmine.createSpy('call').and.callFake(async (args) => {
            if (args.url === 'auth/refresh') {
                throw getApiError({ status: 422, data: args });
            }
            throw getApiError({ status: 401, data: args });
        });
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const apiWithHandlers = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        (apiWithHandlers as any).UID = '123';
        const api = (a: any) => apiWithHandlers(a).catch(handleError);
        const [p1, p2, p3] = [api(123), api(231), api(321)];
        await expectAsync(p1).toBeRejectedWith(InactiveSessionError());
        await expectAsync(p2).toBeRejectedWith(InactiveSessionError());
        await expectAsync(p3).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(4);
        expect(handleError).toHaveBeenCalledTimes(3);
    });

    it('should refresh once and only logout if it is a 4xx error', async () => {
        const returns = [
            () => Promise.reject(getApiError({ status: 401 })),
            () => Promise.reject(getApiError({ status: 500 })),
            () => Promise.reject(getApiError({ status: 401 })),
            () => Promise.reject(getApiError({ status: 422 })),
        ];
        let i = 0;
        const call = jasmine.createSpy('call').and.callFake(() => returns[i++]());

        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            return e;
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        (api as any).UID = '123';

        const error = await api(123).catch(handleError);
        expect(error.status).toBe(500);
        expect(call).toHaveBeenCalledTimes(2);
        expect(handleError).toHaveBeenCalledTimes(1);

        const r2 = api(123);
        await expectAsync(r2).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(4);
    });

    it('should only error with InactiveSession if the initial UID is the same', async () => {
        const returns = [
            () => Promise.reject(getApiError({ status: 401 })),
            () => Promise.reject(getApiError({ status: 400 })),
            () => Promise.reject(getApiError({ status: 401 })),
            () => Promise.reject(getApiError({ status: 400 })),
        ];
        let i = 0;
        const call = jasmine.createSpy('call').and.callFake(() => returns[i++]());
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            return e;
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        (api as any).UID = '123';

        const error = await api(withUIDHeaders('321', {})).catch(handleError);
        expect(error.status).toBe(401);
        expect(call).toHaveBeenCalledTimes(2);
        expect(handleError).toHaveBeenCalledTimes(1);

        const error2 = await api({}).catch(handleError);
        expect(error2.name).toBe('InactiveSession');
        expect(call).toHaveBeenCalledTimes(4);
        expect(handleError).toHaveBeenCalledTimes(2);
    });

    it('should refresh once and handle 429 max attempts', async () => {
        const returns = [
            () => Promise.reject(getApiError({ status: 401 })),
            () => Promise.reject(getApiError({ status: 429 })),
            () => Promise.reject(getApiError({ status: 429 })),
            () => Promise.reject(getApiError({ status: 429 })),
            () => Promise.reject(getApiError({ status: 429 })),
            () => Promise.reject(getApiError({ status: 429 })),
            () => Promise.reject(getApiError({ status: 429 })),
        ];
        let i = 0;
        const call = jasmine.createSpy('call').and.callFake(() => returns[i++]());

        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        (api as any).UID = '126';
        await expectAsync(api(123)).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(6);
    });

    it('should refresh once and handle 429', async () => {
        const returns = [
            () => Promise.reject(getApiError({ status: 401 })), // need refresh
            () => Promise.reject(getApiError({ status: 429 })), // retry
            () => Promise.reject(getApiError({ status: 429 })), // retry
            () => Promise.resolve(getApiResult('')), // refresh ok
            () => Promise.resolve(getApiResult('123')), // actual result
        ];
        let i = 0;
        const call = jasmine.createSpy('call').and.callFake(() => returns[i++]());
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        (api as any).UID = 'abc';
        const result = await api(123).then((result: any) => result.json());
        expect(call).toHaveBeenCalledTimes(5);
        expect(result).toBe('123');
    });

    it('should fail all calls after it has logged out', async () => {
        const call = jasmine.createSpy('call').and.callFake(async (args) => {
            throw getApiError({ status: 401, data: args });
        });
        const api = withApiHandlers({ ...withApiHandlersDefaultParams, call });
        (api as any).UID = '128';
        await expectAsync(api({})).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(2);
        await expectAsync(api({})).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(2);
    });
});

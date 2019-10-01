import withApiHandlers, { CancelUnlockError, InactiveSessionError } from '../../lib/api/helpers/withApiHandlers';

const getApiError = ({ message, response, data, status }) => {
    const error = new Error(message);
    error.status = status;
    error.data = data;
    error.response = response;
    return error;
};

describe('auth handlers', () => {
    it('should unlock', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(Promise.reject(getApiError({ status: 403 })), Promise.resolve('123'));
        const handleUnlock = jasmine.createSpy('unlock').and.returnValues(Promise.resolve());
        const api = withApiHandlers({ call, onUnlock: handleUnlock });
        expect(await api({})).toBe('123');
        expect(handleUnlock).toHaveBeenCalledTimes(1);
        expect(call).toHaveBeenCalledTimes(2);
    });

    it('should unlock and be cancellable', async () => {
        const call = jasmine.createSpy('call').and.returnValues(Promise.reject(getApiError({ status: 403 })));
        const handleUnlock = jasmine.createSpy('unlock').and.returnValues(Promise.reject(CancelUnlockError()));
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, onUnlock: handleUnlock, onError: handleError });
        const error = await api({}).catch((e) => e);
        expect(error.name).toBe('CancelUnlock');
        expect(handleError).toHaveBeenCalledTimes(1);
        expect(handleUnlock).toHaveBeenCalledTimes(1);
        expect(call).toHaveBeenCalledTimes(1);
    });

    it('should retry 429 status', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.resolve('123')
            );
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, onError: handleError });
        expect(await api({})).toBe('123');
        expect(call).toHaveBeenCalledTimes(2);
        expect(handleError).toHaveBeenCalledTimes(0);
    });

    it('should retry maximum 5 times', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } }))
            );
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, onError: handleError });
        const error = await api({}).catch((e) => e);
        expect(error.status).toBe(429);
        expect(call).toHaveBeenCalledTimes(5);
        expect(handleError).toHaveBeenCalledTimes(1);
    });

    it('should not retry when its undefined', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => undefined } } }))
            );
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, onError: handleError });
        const error = await api({}).catch((e) => e);
        expect(error.status).toBe(429);
        expect(call).toHaveBeenCalledTimes(1);
        expect(handleError).toHaveBeenCalledTimes(1);
    });

    it('should not handle retry when its greater than 10', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '10' } } })));
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, onError: handleError });
        const error = await api({}).catch((e) => e);
        expect(error.status).toBe(429);
        expect(call).toHaveBeenCalledTimes(1);
        expect(handleError).toHaveBeenCalledTimes(1);
    });

    it('should not refresh if has no session', async () => {
        const call = jasmine.createSpy('call').and.returnValues(Promise.reject(getApiError({ status: 401 })));
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, hasSession: false, onError: handleError });
        const error = await api({}).catch((e) => e);
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
                return;
            }
            if (!refreshed) {
                throw getApiError({ status: 401 });
            }
            return args;
        });
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, hasSession: true, onError: handleError });
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
        const api = withApiHandlers({ call, hasSession: true, onError: handleError });
        const [p1, p2, p3] = [api(123), api(231), api(321)];
        await expectAsync(p1).toBeRejectedWith(InactiveSessionError());
        await expectAsync(p2).toBeRejectedWith(InactiveSessionError());
        await expectAsync(p3).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(4);
        expect(handleError).toHaveBeenCalledTimes(3);
    });

    it('should refresh once and only logout if it is a 4xx error', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(
                Promise.reject(getApiError({ status: 401 })),
                Promise.reject(getApiError({ status: 500 })),
                Promise.reject(getApiError({ status: 401 })),
                Promise.reject(getApiError({ status: 422 }))
            );

        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, hasSession: true, onError: handleError });
        const error = await api(123).catch((e) => e);
        expect(error.status).toBe(500);
        expect(call).toHaveBeenCalledTimes(2);
        expect(handleError).toHaveBeenCalledTimes(1);

        const r2 = api(123);
        await expectAsync(r2).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(4);
        expect(handleError).toHaveBeenCalledTimes(2);
    });

    it('should refresh once and handle 429 max attempts', async () => {
        const call = jasmine
            .createSpy('call')
            .and.returnValues(
                Promise.reject(getApiError({ status: 401 })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })),
                Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } }))
            );

        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, hasSession: true, onError: handleError });
        await expectAsync(api(123)).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(6);
    });

    it('should refresh once and handle 429', async () => {
        const call = jasmine.createSpy('call').and.returnValues(
            Promise.reject(getApiError({ status: 401 })), // need refresh
            Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })), // retry
            Promise.reject(getApiError({ status: 429, response: { headers: { get: () => '1' } } })), // retry
            Promise.resolve(), // refresh ok
            Promise.resolve('123') // actual result
        );

        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, hasSession: true, onError: handleError });
        const result = await api(123);
        expect(call).toHaveBeenCalledTimes(5);
        expect(result).toBe('123');
    });

    it('should fail all calls after it has logged out', async () => {
        const call = jasmine.createSpy('call').and.callFake(async (args) => {
            throw getApiError({ status: 401, data: args });
        });
        const handleError = jasmine.createSpy('error').and.callFake((e) => {
            throw e;
        });
        const api = withApiHandlers({ call, hasSession: true, onError: handleError });
        await expectAsync(api()).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(2);
        await expectAsync(api()).toBeRejectedWith(InactiveSessionError());
        expect(call).toHaveBeenCalledTimes(2);
    });
});

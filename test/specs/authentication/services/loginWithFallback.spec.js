import service from '../../../../src/app/authentication/services/loginWithFallback';

describe('login with fallback', () => {
    let fn;
    let authApi;
    let srpMock;
    let urlMock;

    beforeEach(() => {
        authApi = {
            info: jasmine.createSpy('authApi')
        };
        srpMock = {
            auth: jasmine.createSpy('srp')
        };
        urlMock = {
            build: () => jasmine.createSpy('url')
        };
        fn = service(authApi, srpMock, urlMock);
    });

    it('should login directly with auth version 4', async () => {
        authApi.info.and.returnValue(Promise.resolve({ Version: 4 }));
        srpMock.auth.and.returnValue(Promise.resolve(1));
        const promise = fn({ Username: 'test', Password: '123' });
        const { authVersion, result } = await promise;
        expect(srpMock.auth).toHaveBeenCalledTimes(1);
        expect(authVersion).toBe(4);
        expect(result).toBe(1);
    });

    it('should login when the fallback version is unknown', async () => {
        const credentials = { Username: 'test', Password: '123' };
        authApi.info.and.returnValue(Promise.resolve({ Version: 0 }));
        srpMock.auth.and.returnValues(
            Promise.reject({ data: { Code: 8002 } }),
            Promise.resolve(1)
        );
        const promise = fn(credentials);
        const { authVersion, result } = await promise;
        expect(srpMock.auth.calls.argsFor(0)).toEqual([
                credentials,
                {
                    method: 'post',
                    url: undefined,
                    data: { Username: 'test' },
                    suppress: [8002]
                },
                { Version: 0 },
                2
            ]
        );
        expect(srpMock.auth.calls.argsFor(1)).toEqual([
                credentials,
                {
                    method: 'post',
                    url: undefined,
                    data: { Username: 'test' }
                },
                { Version: 0 },
                0
            ]
        );
        expect(authVersion).toBe(0);
        expect(result).toBe(1);
    });

    it('not login when the credentials are incorrect', async () => {
        const credentials = { Username: 'test', Password: '123' };
        authApi.info.and.returnValue(Promise.resolve({ Version: 4 }));
        srpMock.auth.and.returnValue(Promise.reject({ data: { Code: 8002 } }),);
        const promise = fn(credentials);
        await expectAsync(promise).toBeRejectedWith({
            data: { Code: 8002 }
        });
    });

    it('not login when the credentials are incorrect and fallback', async () => {
        const credentials = { Username: 'test', Password: '123' };
        authApi.info.and.returnValue(Promise.resolve({ Version: 0 }));
        srpMock.auth.and.returnValues(
            Promise.reject({ data: { Code: 8002 } }),
            Promise.reject({ data: { Code: 8002 } }),
        );
        const promise = fn(credentials);
        await expectAsync(promise).toBeRejectedWith({
            data: { Code: 8002 }
        });
    });
});

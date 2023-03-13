import { disableRandomMock, initRandomMock } from '@proton/testing/lib/mockRandomValues';

import loginWithFallback from '../../lib/authentication/loginWithFallback';
import { Modulus, Salt, ServerEphemeral, ServerProof } from './login.data';

const getInfoResult = (version) => ({
    Username: 'test',
    Version: version,
    Modulus,
    ServerEphemeral,
    Salt,
});

const getResponse = (json) => {
    const result = {
        clone: () => result,
        json: () => json,
    };
    return result;
};

describe('login with fallback', () => {
    beforeAll(() => initRandomMock());
    afterAll(() => disableRandomMock());

    it('should login directly with auth version 4', async () => {
        let authCalls = 0;

        const mockApi = async ({ url }) => {
            if (url.includes('info')) {
                return getInfoResult(4);
            }
            if (url === 'core/v4/auth') {
                authCalls++;
                return getResponse({
                    ServerProof,
                    foo: 'bar',
                });
            }
        };

        const { authVersion, result } = await loginWithFallback({
            api: mockApi,
            credentials: { username: 'test', password: '123' },
        });

        expect(authVersion).toEqual(4);
        expect(result).toEqual(jasmine.objectContaining({ foo: 'bar' }));
        expect(authCalls).toEqual(1);
    });

    it('should login when the fallback version is unknown', async () => {
        const apiCalls = [];

        const mockApi = async (args) => {
            const { url } = args;

            if (url.includes('info')) {
                return getInfoResult(0);
            }

            if (url === 'core/v4/auth') {
                apiCalls.push(args);
                if (apiCalls.length === 1) {
                    // eslint-disable-next-line
                    return Promise.reject({ data: { Code: 8002 } });
                }
                return Promise.resolve(
                    getResponse({
                        ServerProof:
                            'ayugXfnft4D+YtSWCv/Kx1IIXAS850wY8R4BfnD1TwhvRWgu/Mzs0S3DuSwoIV6sE8BcjqimBhxFwZWW1L0Y059UM75FnJZ9H4D/o2CmMze3vOg2ShIpVdrfgMTV8BGlwhzHt6z2yH+m+6WfW7RSKmai46Q7Cj4brTrvxY7xWzsFtJVUbJcgwfSOmi6OBZ1Ouu/yKuwQi554tbBogaLky938SmMP3nDLpvhJCLM9j47eyN2QWU1kFOVu9yy9vN5i7ZuEhREApnX2D5qn3+63bWnxysB0Qx8LD30OnRrxGni4TgpxtsNXbbxMH1XdPrkkeyUxAL0Q25sbTZUdL+zfpA==',
                        foo: 'bar',
                    })
                );
            }
        };

        const { authVersion, result } = await loginWithFallback({
            api: mockApi,
            credentials: { username: 'test', password: '123' },
        });

        expect(authVersion).toEqual(0);
        expect(result).toEqual(jasmine.objectContaining({ foo: 'bar' }));
        expect(apiCalls.length).toEqual(2);
    });

    it('not login when the credentials are incorrect', async () => {
        const mockApi = async (args) => {
            const { url } = args;

            if (url.includes('info')) {
                return getInfoResult(4);
            }

            if (url === 'core/v4/auth') {
                // eslint-disable-next-line
                return Promise.reject({ data: { Code: 8002 } });
            }
        };

        const promise = loginWithFallback({
            api: mockApi,
            credentials: { username: 'test', password: '123' },
        });

        await expectAsync(promise).toBeRejectedWith({
            data: { Code: 8002 },
        });
    });

    it('not login when the credentials are incorrect and fallback', async () => {
        let authCalls = 0;

        const mockApi = async ({ url }) => {
            if (url.includes('info')) {
                return getInfoResult(0);
            }

            if (url === 'core/v4/auth') {
                authCalls++;
                // eslint-disable-next-line
                return Promise.reject({ data: { Code: 8002 } });
            }
        };

        const promise = loginWithFallback({
            api: mockApi,
            credentials: { username: 'test', password: '123' },
        });

        await expectAsync(promise).toBeRejectedWith({
            data: { Code: 8002 },
        });

        expect(authCalls, 2);
    });
});

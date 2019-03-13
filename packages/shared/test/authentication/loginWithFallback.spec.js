import { describe, it } from 'mocha';
import assert from 'assert';
import requireInject from 'require-inject';

const mockSrp = {
    srpAuth: ({ api }) => api({ url: 'auth' })
};

const mocks = {
    '../../lib/srp': mockSrp
};

const { default: loginWithFallback } = requireInject('../../lib/authentication/loginWithFallback', mocks);

describe('login with fallback', () => {
    it('should login directly with auth version 4', async () => {
        let authCalls = 0;

        const mockApi = async ({ url }) => {
            if (url.includes('info')) {
                return { Version: 4 };
            }
            if (url === 'auth') {
                authCalls++;
                return 'foo';
            }
        };

        const { authVersion, result } = await loginWithFallback({
            api: mockApi,
            credentials: { username: 'test', password: '123' }
        });

        assert.strictEqual(authVersion, 4);
        assert.strictEqual(result, 'foo');
        assert.strictEqual(authCalls, 1);
    });

    it('should login when the fallback version is unknown', async () => {
        const apiCalls = [];

        const mockApi = async (args) => {
            const { url } = args;

            if (url.includes('info')) {
                return { Version: 0 };
            }

            if (url === 'auth') {
                apiCalls.push(args);
                if (apiCalls.length === 1) {
                    // eslint-disable-next-line
                    return Promise.reject({ data: { Code: 8002 } });
                }
                return Promise.resolve(1);
            }
        };

        const { authVersion, result } = await loginWithFallback({
            api: mockApi,
            credentials: { username: 'test', password: '123' }
        });

        assert.strictEqual(authVersion, 0);
        assert.strictEqual(result, 1);
        assert.strictEqual(apiCalls.length, 2);
    });

    it('not login when the credentials are incorrect', async () => {
        const mockApi = async (args) => {
            const { url } = args;

            if (url.includes('info')) {
                return { Version: 4 };
            }

            if (url === 'auth') {
                // eslint-disable-next-line
                return Promise.reject({ data: { Code: 8002 } });
            }
        };

        const promise = loginWithFallback({
            api: mockApi,
            credentials: { username: 'test', password: '123' }
        });

        await assert.rejects(promise, {
            data: { Code: 8002 }
        });
    });

    it('not login when the credentials are incorrect and fallback', async () => {
        let authCalls = 0;

        const mockApi = async ({ url }) => {
            if (url.includes('info')) {
                return { Version: 0 };
            }

            if (url === 'auth') {
                authCalls++;
                // eslint-disable-next-line
                return Promise.reject({ data: { Code: 8002 } });
            }
        };

        const promise = loginWithFallback({
            api: mockApi,
            credentials: { username: 'test', password: '123' }
        });

        await assert.rejects(promise, {
            data: { Code: 8002 }
        });

        assert.strictEqual(authCalls, 2);
    });
});

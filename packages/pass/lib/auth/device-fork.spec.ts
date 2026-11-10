import { importKey } from '@protontech/crypto/subtle/aesGcm.ts';

import { InvalidForkConsumeError } from '@proton/shared/lib/authentication/error';
import { type ForkEncryptedBlob, getForkEncryptedBlob } from '@proton/shared/lib/authentication/fork/blob';
import type { PullForkResponse } from '@proton/shared/lib/authentication/interface';

import type { Api } from '../../types/api/api';
import {
    DEVICE_FORK_LIFETIME,
    DEVICE_FORK_POLL_INTERVAL,
    DEVICE_FORK_TOTAL_LIFETIME,
    type DeviceFork,
    DeviceForkExpiredError,
    getDeviceForkConsumeOptions,
    pollDeviceFork,
    requestDeviceFork,
} from './device-fork';
import { consumeFork } from './fork';
import { SESSION_VERSION } from './session';

const HOST = 'https://account.example.com';
const CLIENT_ID = 'macos-pass';
const pending = { status: 422 };
const pulled = { UID: 'uid', Payload: 'payload' } as PullForkResponse;

const mockApi = (pull: jest.Mock = jest.fn().mockRejectedValue(pending)) => {
    let forks = 0;
    return jest.fn(async ({ url }: { url: string }) => {
        if (url === 'auth/v4/sessions/forks') {
            forks += 1;
            return { Selector: `selector-${forks}`, UserCode: 'ABCDEFGH' };
        }
        return pull(url);
    }) as unknown as jest.MockedFunction<Api>;
};

const pullCalls = (api: jest.MockedFunction<Api>) =>
    api.mock.calls.filter(([{ url }]) => url?.startsWith('auth/v4/sessions/forks/'));

describe('device fork', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    describe('requestDeviceFork', () => {
        test('should build the `/desktop/login` URL carrying the payload in the hash', async () => {
            const api = mockApi();
            const fork = await requestDeviceFork({ api, clientID: CLIENT_ID, host: HOST });
            const url = new URL(fork.url);
            const payload = new URLSearchParams(url.hash.slice(1)).get('payload');

            expect(fork.selector).toEqual('selector-1');
            expect(fork.key).toHaveLength(32);
            expect(`${url.origin}${url.pathname}`).toEqual(`${HOST}/desktop/login`);
            expect(Object.fromEntries(url.searchParams)).toEqual({
                app: 'pass',
                pt: 'offline',
                pv: '3',
                redirectUrl: 'protonpass://login',
                remember: '2',
            });
            expect(payload).toEqual(`0:ABCDEFGH:${fork.key.toBase64()}:${CLIENT_ID}`);
        });

        test('should generate a different key for each fork', async () => {
            const api = mockApi();
            const first = await requestDeviceFork({ api, clientID: CLIENT_ID, host: HOST });
            const second = await requestDeviceFork({ api, clientID: CLIENT_ID, host: HOST });
            expect(first.key).not.toEqual(second.key);
        });
    });

    describe('pollDeviceFork', () => {
        test('should resolve with the pulled fork once the pull is not pending anymore', async () => {
            const pull = jest
                .fn()
                .mockRejectedValueOnce(pending)
                .mockRejectedValueOnce(pending)
                .mockResolvedValue(pulled);
            const api = mockApi(pull);
            const onFork = jest.fn();

            const promise = pollDeviceFork({ api, clientID: CLIENT_ID, host: HOST, onFork });
            await jest.advanceTimersByTimeAsync(2 * DEVICE_FORK_POLL_INTERVAL);
            const result = await promise;

            expect(result.response).toEqual(pulled);
            expect(result.selector).toEqual('selector-1');
            expect(onFork).toHaveBeenCalledTimes(1);
            expect(onFork).toHaveBeenCalledWith(expect.objectContaining({ selector: 'selector-1', url: result.url }));
            expect(pullCalls(api)).toHaveLength(3);
            expect(pullCalls(api)[0][0].url).toEqual('auth/v4/sessions/forks/selector-1');
        });

        test('should keep polling on offline errors', async () => {
            const pull = jest.fn().mockRejectedValueOnce({ name: 'OfflineError' }).mockResolvedValue(pulled);
            const promise = pollDeviceFork({ api: mockApi(pull), clientID: CLIENT_ID, host: HOST, onFork: jest.fn() });
            await jest.advanceTimersByTimeAsync(DEVICE_FORK_POLL_INTERVAL);
            expect((await promise).response).toEqual(pulled);
        });

        test('should throw errors other than pending', async () => {
            const error = { status: 400, data: { Code: 2011, Error: 'Invalid' } };
            const api = mockApi(jest.fn().mockRejectedValue(error));
            await expect(pollDeviceFork({ api, clientID: CLIENT_ID, host: HOST, onFork: jest.fn() })).rejects.toBe(
                error
            );
            expect(pullCalls(api)).toHaveLength(1);
        });

        test('should request a new fork when the current one expires', async () => {
            const pull = jest.fn().mockImplementation(async (url: string) => {
                if (url.endsWith('selector-2')) return pulled;
                throw pending;
            });
            const api = mockApi(pull);
            const forks: DeviceFork[] = [];

            const promise = pollDeviceFork({ api, clientID: CLIENT_ID, host: HOST, onFork: (f) => forks.push(f) });
            await jest.advanceTimersByTimeAsync(DEVICE_FORK_LIFETIME + DEVICE_FORK_POLL_INTERVAL);
            const result = await promise;

            expect(forks.map((fork) => fork.selector)).toEqual(['selector-1', 'selector-2']);
            expect(result.selector).toEqual('selector-2');
            expect(result.key).toEqual(forks[1].key);
            expect(result.response).toEqual(pulled);
        });

        test('should give up after the total lifetime', async () => {
            const api = mockApi();
            const onFork = jest.fn();

            const promise = pollDeviceFork({ api, clientID: CLIENT_ID, host: HOST, onFork });
            const assertion = expect(promise).rejects.toBeInstanceOf(DeviceForkExpiredError);
            await jest.advanceTimersByTimeAsync(DEVICE_FORK_TOTAL_LIFETIME + DEVICE_FORK_POLL_INTERVAL);
            await assertion;

            expect(onFork).toHaveBeenCalledTimes(3);
        });

        test('should stop polling when aborted', async () => {
            const api = mockApi();
            const controller = new AbortController();

            const promise = pollDeviceFork({
                api,
                clientID: CLIENT_ID,
                host: HOST,
                signal: controller.signal,
                onFork: jest.fn(),
            });
            const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });
            await jest.advanceTimersByTimeAsync(DEVICE_FORK_POLL_INTERVAL);
            const callsBeforeAbort = pullCalls(api).length;
            controller.abort();
            await assertion;
            await jest.advanceTimersByTimeAsync(5 * DEVICE_FORK_POLL_INTERVAL);

            expect(pullCalls(api)).toHaveLength(callsBeforeAbort);
        });

        test('should only run the abort listener of the pending wait on a late abort', async () => {
            const api = mockApi();
            const controller = new AbortController();

            const promise = pollDeviceFork({
                api,
                clientID: CLIENT_ID,
                host: HOST,
                signal: controller.signal,
                onFork: jest.fn(),
            });
            const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' });
            await jest.advanceTimersByTimeAsync(10 * DEVICE_FORK_POLL_INTERVAL);

            const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');
            controller.abort();
            await assertion;

            expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
        });
    });
});

describe('getDeviceForkConsumeOptions', () => {
    const OFFLINE_KD = 'k'.repeat(32);
    const user = { ID: 'user-id', Email: 'user@example.com', DisplayName: 'User', Flags: { sso: false } };

    const api = jest.fn(async ({ url }: { url: string }) => {
        if (url === 'auth/v4/refresh') return { AccessToken: 'access', RefreshToken: 'refresh' };
        if (url === 'core/v4/users') return { User: user };
        return {};
    }) as unknown as Api;

    const getPulledFork = async (blob: ForkEncryptedBlob, key = crypto.getRandomValues(new Uint8Array(32))) => {
        const Payload = await getForkEncryptedBlob(await importKey(key), blob, 3);
        const response = { UID: 'uid', RefreshToken: 'refresh', LocalID: 7, Payload, Scopes: ['pass'] };
        return { selector: 'selector', url: '', key, response: response as unknown as PullForkResponse };
    };

    test('should create a persistent session with the offline components of an `offline` blob', async () => {
        const fork = await getPulledFork({
            type: 'offline',
            keyPassword: 'key-password',
            offlineKeyPassword: btoa(OFFLINE_KD),
            offlineKeySalt: btoa('offline-salt'),
        });

        const { session, Scopes } = await consumeFork({ api, ...getDeviceForkConsumeOptions(fork) });

        expect(Scopes).toEqual(['pass']);
        expect(session).toMatchObject({
            UID: 'uid',
            LocalID: 7,
            UserID: 'user-id',
            keyPassword: 'key-password',
            offlineKD: OFFLINE_KD,
            offlineConfig: expect.objectContaining({ salt: 'offline-salt' }),
            offlineVerifier: expect.any(String),
            payloadVersion: SESSION_VERSION,
            persistent: true,
            sso: false,
        });
    });

    test('should create a session without offline components from a `default` blob', async () => {
        const fork = await getPulledFork({ type: 'default', keyPassword: 'key-password' });

        const { session } = await consumeFork({ api, ...getDeviceForkConsumeOptions(fork) });

        expect(session.keyPassword).toEqual('key-password');
        expect(session.offlineKD).toBeUndefined();
        expect(session.offlineConfig).toBeUndefined();
        expect(session.offlineVerifier).toBeUndefined();
    });

    test('should reject a payload encrypted with another key', async () => {
        const fork = await getPulledFork({ type: 'default', keyPassword: 'key-password' });
        const wrongKeyFork = { ...fork, key: crypto.getRandomValues(new Uint8Array(32)) };

        await expect(consumeFork({ api, ...getDeviceForkConsumeOptions(wrongKeyFork) })).rejects.toBeInstanceOf(
            InvalidForkConsumeError
        );
    });
});

import { APPS } from '@proton/shared/lib/constants';

import type { Api } from '../../types/api/api';
import type { ConsumeForkPayload } from './fork';
import { generateForkSecret, getForkChallenge, pullFork, requestFork } from './fork';

describe('fork', () => {
    describe('generateForkSecret', () => {
        test('should generate a random 32 bytes hex secret', () => {
            const secret = generateForkSecret();
            expect(secret).toMatch(/^[a-f0-9]{64}$/);
            expect(generateForkSecret()).not.toEqual(secret);
        });
    });

    describe('getForkChallenge', () => {
        test('should compute the hex encoded SHA256 digest of the secret', async () => {
            expect(await getForkChallenge('abc')).toEqual(
                'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
            );
        });
    });

    describe('requestFork', () => {
        test('should add the fork challenge to the authorize URL', () => {
            const { url } = requestFork({ app: APPS.PROTONPASS, forkChallenge: 'challenge' });
            expect(new URL(url).searchParams.get('forkChallenge')).toEqual('challenge');
        });

        test('should omit the fork challenge when not provided', () => {
            const { url } = requestFork({ app: APPS.PROTONPASS });
            expect(new URL(url).searchParams.has('forkChallenge')).toBe(false);
        });

        test('should request a dependent fork by default', () => {
            const { url } = requestFork({ app: APPS.PROTONPASS });
            expect(new URL(url).searchParams.get('independent')).toEqual('0');
        });

        test('should show the remember me checkbox by default', () => {
            const { url } = requestFork({ app: APPS.PROTONPASS });
            expect(new URL(url).searchParams.has('remember')).toBe(false);
        });

        test('should hide the remember me checkbox when asked', () => {
            const { url } = requestFork({ app: APPS.PROTONPASS, hideRememberMe: true });
            expect(new URL(url).searchParams.get('remember')).toEqual('2');
        });

        test('should request an independent fork when asked', () => {
            const { url } = requestFork({ app: APPS.PROTONPASS, independent: true });
            expect(new URL(url).searchParams.get('independent')).toEqual('1');
        });
    });

    describe('pullFork', () => {
        const api = vi.fn().mockResolvedValue({}) as unknown as Api;

        const payload: ConsumeForkPayload = {
            forkSecret: null,
            key: new Uint8Array(32),
            localState: '{}',
            mode: 'web',
            payloadVersion: 2,
            persistent: false,
            selector: 'selector',
            state: 'state',
        };

        beforeEach(() => vi.clearAllMocks());

        test('should send the fork secret header when provided', async () => {
            await pullFork({ api, payload: { ...payload, forkSecret: 'secret' } });

            expect(api).toHaveBeenCalledWith({
                method: 'get',
                url: 'auth/v4/sessions/forks/selector',
                headers: { 'x-pm-fork-secret': 'secret' },
                unauthenticated: true,
            });
        });

        test('should not send any fork secret header when missing', async () => {
            await pullFork({ api, payload });

            expect(api).toHaveBeenCalledWith({
                method: 'get',
                url: 'auth/v4/sessions/forks/selector',
                headers: undefined,
                unauthenticated: true,
            });
        });
    });
});

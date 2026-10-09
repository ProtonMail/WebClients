import { APPS } from '@proton/shared/lib/constants';

import type { Api } from '../../types';
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
    });

    describe('pullFork', () => {
        const api = jest.fn().mockResolvedValue({}) as unknown as Api;

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

        beforeEach(() => jest.clearAllMocks());

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

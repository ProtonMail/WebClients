import { jest } from '@jest/globals';
import type { PrivateKeyReference } from '@protontech/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@protontech/crypto';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { addMasterKey, masterKeyFailed } from '../redux/slices/core/credentials';
import { addDataLossWarning } from '../redux/slices/meta/errors';
import { LUMO_ELIGIBILITY } from '../types';
import type { MasterKeyEnvelope } from './lumoBootstrap';

jest.mock('@proton/account', () => ({
    addressKeysThunk: () => async () => [],
    addressesThunk: () => async () => [],
    userKeysThunk: () => async () => [],
}));

type DispatchedAction = { type?: string; payload?: unknown } | ((dispatch: unknown) => unknown);

/** Minimal thunk-capable dispatch: runs thunks, records plain actions. */
function makeDispatch() {
    const actions: DispatchedAction[] = [];
    const dispatch = (action: DispatchedAction): unknown => {
        if (typeof action === 'function') {
            return (action as (dispatch: unknown) => unknown)(dispatch);
        }
        actions.push(action);
        return action;
    };
    return { dispatch, actions };
}

const userKey = {
    privateKey: { id: 'user-private' },
    publicKey: { id: 'user-public' },
} as unknown as DecryptedKey<PrivateKeyReference>;

describe('loadKeysAndMasterKey — recovery from undecryptable envelopes (LUMO-853)', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetModules();
    });

    it('mints a fresh master key instead of permanently failing when no envelope can be decrypted', async () => {
        const staleEnvelope = {
            id: 'stale-envelope',
            isLatest: true,
            version: 1,
            createdAt: '2020-01-01T00:00:00.000Z',
            masterKey: 'U1RBTEU=', // base64("STALE")
        };
        const freshEnvelope = {
            id: 'fresh-envelope',
            isLatest: true,
            version: 2,
            createdAt: '2026-01-01T00:00:00.000Z',
            masterKey: 'RlJFU0g=', // base64("FRESH")
        };

        const getMasterKeysResponses: MasterKeyEnvelope[] = [
            // First call: only the pre-reset, now-undecryptable envelope.
            { eligibility: LUMO_ELIGIBILITY.Eligible, keys: [staleEnvelope] },
            // Second call, after minting a replacement: the fresh envelope is decryptable.
            { eligibility: LUMO_ELIGIBILITY.Eligible, keys: [freshEnvelope] },
        ];

        type Envelope = MasterKeyEnvelope['keys'][number];

        const getMasterKeys = jest.fn(() => Promise.resolve(getMasterKeysResponses.shift()!));
        const postMasterKey = jest.fn(() => Promise.resolve(undefined));

        jest.doMock('../remote/api', () => {
            const actual = jest.requireActual('../remote/api') as object;
            class FakeLumoApi {
                getMasterKeys = getMasterKeys;
                postMasterKey = postMasterKey;
                findBestKey = (keys: Envelope[]) =>
                    keys.reduce(
                        (best: Envelope | undefined, current: Envelope) =>
                            !best || current.isLatest ? current : best,
                        undefined as Envelope | undefined
                    );
            }
            return { ...actual, LumoApi: FakeLumoApi };
        });

        // The stale envelope can never be decrypted (its keys are gone); the freshly minted one
        // always succeeds, both when it is signed during minting and when it is verified back.
        jest.spyOn(CryptoProxy, 'decryptMessage').mockImplementation(async ({ binaryMessage }) => {
            const asString = Buffer.from(binaryMessage as Uint8Array<ArrayBuffer>).toString();
            if (asString === 'STALE') {
                throw new Error('Session key decryption failed');
            }
            return {
                data: { toBase64: () => 'FRESH_AES_KEY' },
                verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
            } as never;
        });
        jest.spyOn(CryptoProxy, 'encryptMessage').mockResolvedValue({
            message: { toBase64: () => 'RlJFU0g=' },
        } as never);

        const { loadKeysAndMasterKey } = await import('./lumoBootstrap');
        const { dispatch, actions } = makeDispatch();

        const result = await loadKeysAndMasterKey('uid-123', {
            userKeysPromise: Promise.resolve([userKey]),
        })(dispatch as never);

        expect(postMasterKey).toHaveBeenCalledTimes(1);
        expect(getMasterKeys).toHaveBeenCalledTimes(2);

        expect(actions.some((a) => masterKeyFailed.match(a as never))).toBe(false);
        expect(actions.some((a) => addMasterKey.match(a as never))).toBe(true);
        expect(actions.some((a) => addDataLossWarning.match(a as never))).toBe(true);

        expect(result?.masterKeysBundle.primaryMasterKeyId).toBe('fresh-envelope');
    });
});

/** @jest-environment node */
import { importKey } from '@protontech/crypto/subtle/aesGcm.ts';

import { getForkDecryptedBlob } from '@proton/shared/lib/authentication/fork/blob';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { signInWithAnotherDevicePush } from './signInWithAnotherDevicePush';

const bytes = crypto.getRandomValues(new Uint8Array(32));
const qrCodePayload = { version: 0, userCode: 'ABCD2345', encodedBytes: bytes.toBase64(), childClientId: 'macos-pass' };
const offlineKey = { password: 'offline-password', salt: 'offline-salt' };

const push = async (payloadType?: 'offline' | 'default') => {
    const api = jest.fn(async () => ({}));
    await signInWithAnotherDevicePush({
        api: api as unknown as Api,
        qrCodePayload,
        keyPassword: 'key-password',
        offlineKey,
        forkParameters: { payloadVersion: 3, payloadType },
    });
    const [[{ data }]] = api.mock.calls as unknown as [[{ data: { Payload: string } }]];
    return getForkDecryptedBlob(await importKey(bytes), data.Payload, 3);
};

describe('signInWithAnotherDevicePush', () => {
    it('sends the offline key when the offline payload is requested', async () => {
        expect(await push('offline')).toEqual({
            type: 'offline',
            keyPassword: 'key-password',
            offlineKeyPassword: 'offline-password',
            offlineKeySalt: 'offline-salt',
        });
    });

    it('sends only the key password by default', async () => {
        expect(await push()).toEqual({ type: 'default', keyPassword: 'key-password' });
    });
});

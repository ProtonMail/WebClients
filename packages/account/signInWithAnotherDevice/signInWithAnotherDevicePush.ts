import { importKey } from '@protontech/crypto/subtle/aesGcm.ts';

import { pushForkSession } from '@proton/shared/lib/api/auth';
import { getForkBlobData, getForkEncryptedBlob } from '@proton/shared/lib/authentication/fork/blob';
import type { ProduceForkParameters } from '@proton/shared/lib/authentication/fork/produce';
import type { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import type { OfflineKey } from '@proton/shared/lib/authentication/offlineKey';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import type { QRCodePayload } from './qrCodePayload';

const getKey = async (encodedBytes: string) => {
    try {
        return await importKey(Uint8Array.fromBase64(encodedBytes));
    } catch (e) {
        // This hides errors such as 'failed to execute 'atob' on 'Window' when the code is invalid
        throw new Error('Invalid code');
    }
};

// Main function which takes a QR code and key password to push the session to the requested fork
export const signInWithAnotherDevicePush = async ({
    api,
    qrCodePayload,
    keyPassword,
    offlineKey,
    forkParameters,
}: {
    api: Api;
    qrCodePayload: QRCodePayload;
    keyPassword: string;
    offlineKey?: OfflineKey;
    forkParameters: Pick<ProduceForkParameters, 'payloadVersion'> & Partial<Pick<ProduceForkParameters, 'payloadType'>>;
}) => {
    let payload: string | undefined;
    // When encoded bytes is empty, no payload is expected
    if (qrCodePayload.encodedBytes) {
        payload = await getForkEncryptedBlob(
            await getKey(qrCodePayload.encodedBytes),
            getForkBlobData({ keyPassword, offlineKey, payloadType: forkParameters.payloadType }),
            forkParameters.payloadVersion
        );
    }

    await api<PushForkResponse>(
        pushForkSession({
            Payload: payload,
            ChildClientID: qrCodePayload.childClientId,
            Independent: 1,
            UserCode: qrCodePayload.userCode,
        })
    );
};

import type { QRCodePayload } from '@proton/account/signInWithAnotherDevice/qrCodePayload';
import { importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import { getForkEncryptedBlob } from '@proton/shared/lib/authentication/fork/blob';
import type { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { Api } from '@proton/shared/lib/interfaces';

const getKey = async (encodedBytes: string) => {
    try {
        return await importKey(base64StringToUint8Array(encodedBytes));
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
}: {
    api: Api;
    qrCodePayload: QRCodePayload;
    keyPassword: string;
}) => {
    let payload: string | undefined;
    // When encoded bytes is empty, no payload is expected
    if (qrCodePayload.encodedBytes) {
        payload = await getForkEncryptedBlob(
            await getKey(qrCodePayload.encodedBytes),
            {
                type: 'default',
                keyPassword,
            },
            1
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

import { deserializeQrCodePayload } from '@proton/account/signInWithAnotherDevice/qrCodePayload';
import { importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { pushForkSession } from '@proton/shared/lib/api/auth';
import { getForkEncryptedBlob } from '@proton/shared/lib/authentication/fork/blob';
import type { PushForkResponse } from '@proton/shared/lib/authentication/interface';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { Api } from '@proton/shared/lib/interfaces';

// Main function which takes a QR code and key password to push the session to the requested fork
export const signInWithAnotherDevicePush = async ({
    api,
    data,
    keyPassword,
}: {
    api: Api;
    data: string;
    keyPassword: string;
}) => {
    const qrCodePayload = deserializeQrCodePayload(data);
    const payload = await getForkEncryptedBlob(
        await importKey(base64StringToUint8Array(qrCodePayload.encodedBytes)),
        {
            type: 'default',
            keyPassword,
        },
        1
    );
    await api<PushForkResponse>(
        pushForkSession({
            Payload: payload,
            ChildClientID: qrCodePayload.childClientId,
            Independent: 1,
            UserCode: qrCodePayload.userCode,
        })
    );
};

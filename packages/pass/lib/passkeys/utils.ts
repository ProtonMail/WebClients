import type { Passkey } from '@proton/pass/types/protobuf/item-v1';
import { type SanitizedBuffers } from '@proton/pass/utils/buffer/sanitization';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

export const parsePasskey = (passkey: SanitizedBuffers<Passkey>): Passkey => ({
    ...passkey,
    content: base64StringToUint8Array(passkey.content),
    credentialId: base64StringToUint8Array(passkey.credentialId),
    userHandle: base64StringToUint8Array(passkey.userHandle),
    userId: base64StringToUint8Array(passkey.userId),
});

import type { WasmGeneratePasskeyResponse } from '@protontech/pass-rust-core';

import type { Passkey } from '@proton/pass/types/protobuf/item-v1';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import type { SanitizedPasskey } from './types';

export const parsePasskey = (passkey: SanitizedPasskey): Passkey => ({
    ...passkey,
    content: base64StringToUint8Array(passkey.content),
    credentialId: base64StringToUint8Array(passkey.credentialId),
    userHandle: base64StringToUint8Array(passkey.userHandle),
    userId: base64StringToUint8Array(passkey.userId),
});

export const sanitizePasskey = (response: WasmGeneratePasskeyResponse): SanitizedPasskey => ({
    keyId: response.key_id,
    content: uint8ArrayToBase64String(new Uint8Array(response.passkey)),
    domain: response.domain,
    rpId: response.rp_id!,
    rpName: response.rp_name,
    userName: response.user_name,
    userDisplayName: response.user_display_name,
    userId: uint8ArrayToBase64String(new Uint8Array(response.user_id)),
    createTime: getEpoch(),
    note: '',
    credentialId: uint8ArrayToBase64String(new Uint8Array(response.credential_id)),
    userHandle: uint8ArrayToBase64String(new Uint8Array(response.user_handle ?? [])),
});

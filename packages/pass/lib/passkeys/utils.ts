import type { WasmGeneratePasskeyResponse } from '@protontech/pass-rust-core/worker';

import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import type { Passkey } from '@proton/pass/types/protobuf/item-v1';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getBrowser, getDevice } from '@proton/shared/lib/helpers/browser';

import type { SanitizedPasskey } from './types';

export const parsePasskey = (passkey: SanitizedPasskey): Passkey => ({
    ...passkey,
    content: Uint8Array.fromBase64(passkey.content),
    credentialId: Uint8Array.fromBase64(passkey.credentialId),
    userHandle: Uint8Array.fromBase64(passkey.userHandle),
    userId: Uint8Array.fromBase64(passkey.userId),
});

export const sanitizePasskey = (response: WasmGeneratePasskeyResponse, config: PassConfig): SanitizedPasskey => ({
    keyId: response.key_id,
    content: new Uint8Array(response.passkey).toBase64(),
    domain: response.domain,
    rpId: response.rp_id!,
    rpName: response.rp_name,
    userName: response.user_name,
    userDisplayName: response.user_display_name,
    userId: new Uint8Array(response.user_id).toBase64(),
    createTime: getEpoch(),
    note: '',
    credentialId: new Uint8Array(response.credential_id).toBase64(),
    userHandle: new Uint8Array(response.user_handle ?? []).toBase64(),
    creationData: {
        osName: getBrowser().name ?? '',
        osVersion: getBrowser().version ?? '',
        deviceName: getDevice().vendor ?? '',
        appVersion: `${getClientID(config.APP_NAME)}@${config.APP_VERSION}`,
    },
});

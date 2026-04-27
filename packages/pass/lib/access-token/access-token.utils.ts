import { uint8ArrayToB64URL } from '@proton/pass/utils/buffer/sanitization';

export const PAT_PRODUCT = 'pass';

/** The string a user pastes into the Pass CLI (or its env var).
 * Format: `<server-issued-token>::<urlsafe-base64-no-pad(raw-key)>` */
export const buildAccessTokenEnvVar = (token: string, rawKey: Uint8Array<ArrayBuffer>): string =>
    `${token}::${uint8ArrayToB64URL(rawKey)}`;

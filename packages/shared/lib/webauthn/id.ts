import type { RegisteredKey } from '@proton/shared/lib/webauthn/interface';

export const getId = (registeredKey: RegisteredKey) => {
    return new Uint8Array(registeredKey.CredentialID).toBase64({ alphabet: 'base64url', omitPadding: true });
};

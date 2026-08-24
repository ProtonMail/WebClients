import type { RegisteredKey } from './interface';

export const getId = (registeredKey: RegisteredKey) => {
    return new Uint8Array(registeredKey.CredentialID).toBase64({ alphabet: 'base64url', omitPadding: true });
};

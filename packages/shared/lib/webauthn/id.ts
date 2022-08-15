import { encodeBase64URL, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { RegisteredKey } from '@proton/shared/lib/webauthn/interface';

export const getId = (registeredKey: RegisteredKey) => {
    return encodeBase64URL(uint8ArrayToString(new Uint8Array(registeredKey.CredentialID)));
};

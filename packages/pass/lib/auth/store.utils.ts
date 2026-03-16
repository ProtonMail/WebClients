import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@proton/crypto/lib/utils';
import { deobfuscate, obfuscate, obfuscateLegacy } from '@proton/pass/utils/obfuscate/xor';
import { deserialize, serialize } from '@proton/pass/utils/object/serialize';

/** @deprecated use encodeUserData */
export const encodeUserDataLegacy = (email: string = '', displayName: string = ''): string => {
    const encodedEmail = JSON.stringify(obfuscateLegacy(email));
    const encodedDisplayName = JSON.stringify(obfuscateLegacy(displayName));
    return utf8StringToUint8Array(`${encodedEmail}.${encodedDisplayName}`).toBase64();
};

export const encodeUserData = (email: string = '', displayName: string = '') => {
    const encodedEmail = serialize(obfuscate(email));
    const encodedDisplayName = serialize(obfuscate(displayName));
    return utf8StringToUint8Array(`${encodedEmail}.${encodedDisplayName}`).toBase64();
};

export const decodeUserData = (userData: string): { PrimaryEmail?: string; DisplayName?: string } => {
    try {
        const [encodedEmail, encodedDisplayName] = uint8ArrayToUtf8String(Uint8Array.fromBase64(userData)).split('.');
        return {
            PrimaryEmail: deobfuscate(deserialize(encodedEmail)),
            DisplayName: deobfuscate(deserialize(encodedDisplayName)),
        };
    } catch {
        return {};
    }
};

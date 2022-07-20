import { CryptoProxy, KeyInfo } from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';
import { readFileAsString } from '../helpers/file';

export interface ArmoredKeyWithInfo extends KeyInfo {
    /**
     * Armored key corresponding to the key info.
     * This could be a decrypted private key (see `this.keyIsDecrypted`), so handle with care.
     */
    armoredKey: string;
}

const ARMORED_KEY_EXPR =
    /-----BEGIN PGP (PRIVATE|PUBLIC) KEY BLOCK-----(?:(?!-----)[\s\S])*-----END PGP (PRIVATE|PUBLIC) KEY BLOCK-----/g;

export const parseArmoredKeys = (fileString: string) => {
    return fileString.match(ARMORED_KEY_EXPR) || [];
};

export const parseKeys = (filesAsStrings: string[] = []) => {
    const armoredKeys = parseArmoredKeys(filesAsStrings.join('\n'));
    if (!armoredKeys.length) {
        return [];
    }

    return Promise.all(
        armoredKeys.map(async (armoredKey) => {
            try {
                const keyInfo = await CryptoProxy.getKeyInfo({ armoredKey });
                const ArmoredKeyWithInfo = {
                    ...keyInfo,
                    armoredKey,
                };
                return ArmoredKeyWithInfo;
            } catch (e: any) {
                // ignore errors
            }
        })
    ).then((result) => result.filter<ArmoredKeyWithInfo>(isTruthy));
};

export const parseKeyFiles = async (files: File[] = []) => {
    const filesAsStrings = await Promise.all(files.map((file) => readFileAsString(file))).catch(() => []);
    return parseKeys(filesAsStrings);
};

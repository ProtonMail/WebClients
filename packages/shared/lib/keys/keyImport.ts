import { getKeys } from 'pmcrypto';

import { readFileAsString } from '../helpers/file';
import isTruthy from '../helpers/isTruthy';

const PRIVATE_KEY_EXPR = /-----BEGIN PGP (PRIVATE|PUBLIC) KEY BLOCK-----(?:(?!-----)[\s\S])*-----END PGP (PRIVATE|PUBLIC) KEY BLOCK-----/g;

export const parseArmoredKeys = (fileString: string) => {
    return fileString.match(PRIVATE_KEY_EXPR) || [];
};

export const parseKeys = (filesAsStrings: string[] = []) => {
    const armoredKeys = parseArmoredKeys(filesAsStrings.join('\n'));
    if (!armoredKeys.length) {
        return [];
    }

    return Promise.all(
        armoredKeys.map(async (armoredPrivateKey) => {
            try {
                const [key] = await getKeys(armoredPrivateKey);
                return key;
            } catch (e) {
                // ignore errors
            }
        })
    ).then((result) => result.filter(isTruthy));
};

export const parseKeyFiles = async (files: File[] = []) => {
    const filesAsStrings = await Promise.all(files.map(readFileAsString)).catch(() => []);
    return parseKeys(filesAsStrings);
};

// import { useCallback } from 'react';
import { useCache } from '@proton/components';

// import { verify as verifySignature } from '../helpers/signatures';

const CACHE_KEY = 'Signatures';

// TODO: Use a listenable cache to be able to get reactive data from views

export type SignatureCache = Map<string, any>;

export const useSignaturesCache = (): SignatureCache => {
    const cache = useCache();

    if (!cache.has(CACHE_KEY)) {
        cache.set(CACHE_KEY, new Map());
    }
    return cache.get(CACHE_KEY);
};

// export const useSignatures = () => {
//     const cache = useSignaturesCache();

//     const verify = useCallback((attachment, decryptedAttachment, { publicKeys }, embeddedSigs = []) =>
//         verifySignature(attachment, decryptedAttachment, { publicKeys }, embeddedSigs, cache)
//     );

//     return { verify };
// };

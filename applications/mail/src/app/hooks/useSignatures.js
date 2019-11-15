import { useCallback } from 'react';
import { useCache } from 'react-components';
import { verify as verifySignature } from '../helpers/signatures';

const CACHE_KEY = 'Signatures';

// TODO: Use a listenable cache to be able to get reactive data from views

export const useSignaturesCache = () => {
    const cache = useCache();

    if (!cache.has(CACHE_KEY)) {
        cache.set(CACHE_KEY, new Map());
    }
    return cache.get(CACHE_KEY);
};

export const useSignatures = () => {
    const cache = useSignaturesCache();

    const verify = useCallback((attachment, decryptedAttachment, { publicKeys }, embeddedSigs = []) =>
        verifySignature(attachment, decryptedAttachment, { publicKeys }, embeddedSigs, cache)
    );

    return { verify };
};

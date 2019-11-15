import { useCallback } from 'react';
import { useCache, useApi } from 'react-components';
import { getAndVerify, getCacheKey } from '../helpers/attachments';
import { parser } from '../helpers/embedded/embedded';
import { useSignatures } from './useSignatures';

const CACHE_KEY = 'Attachments';

// TODO: Use a listenable cache to be able to get reactive data from views

export const useAttachmentsCache = () => {
    const cache = useCache();

    if (!cache.has(CACHE_KEY)) {
        cache.set(CACHE_KEY, new Map());
    }
    return cache.get(CACHE_KEY);
};

export const useAttachments = () => {
    const cache = useAttachmentsCache();
    const api = useApi();
    const { verify } = useSignatures();

    const get = useCallback(
        (attachment = {}, message = {}) => getAndVerify(attachment, message, false, { cache, api, verify }),
        [cache, api]
    );

    const reverify = useCallback(
        (attachment = {}, message = {}) => getAndVerify(attachment, message, true, { cache, api, verify }),
        [cache, api]
    );

    const has = useCallback((attachment = {}) => cache.get(getCacheKey(attachment)), [cache]);

    return { get, reverify, has };
};

export const useTransformAttachments = () => {
    const attachmentLoader = useAttachments();

    return useCallback(async (message, { mailSettings }) => {
        return parser(message, mailSettings, { direction: 'blob', attachmentLoader });
    });
};

import { useCallback } from 'react';
import { useCache } from 'react-components';
import { useGetMailSettings } from './useMailSettings';
import { transformEscape } from '../transforms/transformEscape';
import { transformLinks } from '../transforms/transformLinks';
import { transformEmbedded } from '../transforms/transformEmbedded';
import { transformWelcome } from '../transforms/transformWelcome';
import { transformBlockquotes } from '../transforms/transformBlockquotes';
import { transformStylesheet } from '../transforms/transformStylesheet';
import { transformAttachements } from '../transforms/transformAttachements';
import { transformRemote } from '../transforms/transformRemote';

// Reference: Angular/src/app/message/services/prepareContent.js

const transformers = [
    transformEscape,
    transformLinks,
    transformEmbedded,
    transformWelcome,
    transformBlockquotes,
    transformStylesheet,
    transformAttachements,
    transformRemote
];

export const useFormatContent = () => {
    const getMailSettings = useGetMailSettings();
    const cache = useCache();

    // TODO: Handle blacklist and whitelist

    return useCallback(async (content, message, action) => {
        const mailSettings = await getMailSettings();

        console.log('formatContent', document, message, mailSettings);

        const result = await transformers.reduce(async (documentPromise, transformer) => {
            const document = await documentPromise;
            console.log('transformer', transformer);
            return transformer(document, message, { action, cache, mailSettings });
        }, content);

        return result.innerHTML;
    });
};

import { useCallback } from 'react';
import { useCache } from 'react-components';
import { useGetMailSettings } from './useMailSettings';
import { transformEscape } from '../transforms/transformEscape';
import { transformLinks } from '../transforms/transformLinks';
import { transformEmbedded } from '../transforms/transformEmbedded';

// Reference: Angular/src/app/message/services/prepareContent.js

const transformers = [
    transformEscape,
    transformLinks,
    transformEmbedded
    // TODO: transformWelcome,
    // TODO: transformBlockquotes,
    // TODO: transformStylesheet
    // TODO: transformAttachements
    // TODO: transformRemote
];

export const useFormatContent = () => {
    const getMailSettings = useGetMailSettings();
    const cache = useCache();

    // TODO: Handle blacklist and whitelist

    return useCallback(async (content, message, action) => {
        const mailSettings = await getMailSettings();

        console.log('formatContent', document, message, mailSettings);

        const result = await transformers.reduce(async (documentPromise, transformer) => {
            console.log('transformer', transformer);
            return transformer(await documentPromise, message, { action, cache, mailSettings });
        }, content);

        return result.innerHTML;
    });
};

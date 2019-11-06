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
import { transformBase } from '../transforms/transformBase';

// Reference: Angular/src/app/message/services/prepareContent.js

const transformers = [
    transformEscape, // Has to be in first place as it initialy parse the string content
    transformBase,
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

        console.log('formatContent', content, message, mailSettings);

        let resultMetadata = {};

        const { document } = await transformers.reduce(
            async (promise, transformer) => {
                const { document, metadata = {} } = await promise;
                resultMetadata = { ...resultMetadata, ...metadata };
                console.log('transformer', transformer);
                return transformer({ document, message, action, cache, mailSettings });
            },
            { document: content }
        );

        return { content: document.innerHTML, metadata: resultMetadata };
    });
};

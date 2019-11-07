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

const all = [
    transformEscape,
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

    const formatContent = async (inputMetadata, message, transformers, action) => {
        const mailSettings = await getMailSettings();

        // console.log('formatContent', inputMetadata, message, mailSettings);

        const metadata = await transformers.reduce(async (promise, transformer) => {
            const metadata = await promise;
            const newMetadata = await transformer(metadata, { message, action, cache, mailSettings });
            return { ...metadata, ...newMetadata };
        }, inputMetadata);

        return { ...metadata, content: metadata.document.innerHTML };
    };

    const initialize = (metadata, message, action) => {
        return formatContent(metadata, message, all, action);
    };

    const loadImages = (metadata, message, action) => {
        return formatContent({ ...metadata, showImages: true }, message, [transformRemote], action);
    };

    return { initialize, loadImages };
};

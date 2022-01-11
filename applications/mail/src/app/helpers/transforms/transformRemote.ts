import generateUID from '@proton/shared/lib/helpers/generateUID';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { isDraft } from '@proton/shared/lib/mail/messages';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/constants';
import { querySelectorAll } from '../message/messageContent';
import { hasShowRemote } from '../mailSettings';
import { getRemoteImages, insertImageAnchor } from '../message/messageImages';
import {
    ATTRIBUTES,
    hasToSkipProxy,
    loadFakeImages,
    loadRemoteImages,
    loadSkipProxyImages,
    removeProtonPrefix,
} from '../message/messageRemotes';
import { MessageRemoteImage, MessageState } from '../../logic/messages/messagesTypes';

const WHITELIST = ['notify@protonmail.com'];

const SELECTOR = ATTRIBUTES.map((name) => {
    if (name === 'src') {
        return '[proton-src]:not([proton-src^="cid"]):not([proton-src^="data"])';
    }

    // https://stackoverflow.com/questions/23034283/is-it-possible-to-use-htmls-queryselector-to-select-by-xlink-attribute-in-an
    if (name === 'xlink:href') {
        return '[*|href]:not([href])';
    }

    return `[proton-${name}]`;
}).join(',');

const getRemoteImageMatches = (message: MessageState) => {
    const imageElements = querySelectorAll(message, SELECTOR);

    const elementsWithStyleTag = querySelectorAll(message, '[style]').reduce<HTMLElement[]>((acc, elWithStyleTag) => {
        const styleTagValue = elWithStyleTag.getAttribute('style');
        const hasSrcAttribute = elWithStyleTag.hasAttribute('src');

        if (styleTagValue && !hasSrcAttribute && styleTagValue.includes('proton-url')) {
            acc.push(elWithStyleTag);
        }

        return acc;
    }, []);

    return {
        matchedElements: [...imageElements, ...elementsWithStyleTag],
        hasRemoteImages: imageElements.length + elementsWithStyleTag.length > 0,
    };
};

export const transformRemote = (
    message: MessageState,
    mailSettings: Partial<MailSettings> | undefined,
    onLoadRemoteImagesDirect: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadRemoteImagesProxy?: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadFakeImagesProxy?: (imagesToLoad: MessageRemoteImage[]) => void
) => {
    const showRemoteImages =
        message.messageImages?.showRemoteImages ||
        hasShowRemote(mailSettings) ||
        WHITELIST.includes(message.data?.Sender?.Address || '');

    const draft = isDraft(message.data);

    const useProxy = hasBit(mailSettings?.ImageProxy, IMAGE_PROXY_FLAGS.PROXY);

    const { matchedElements, hasRemoteImages } = getRemoteImageMatches(message);
    const remoteImages = getRemoteImages(message);

    const skipProxy = hasToSkipProxy(remoteImages);

    matchedElements.forEach((match) => {
        // Avoid duplicating images
        if (remoteImages.find(({ original }) => original === match)) {
            return;
        }

        const id = generateUID('remote');
        if (match.tagName === 'IMG') {
            if (!draft) {
                insertImageAnchor(id, 'remote', match);
            } else if (showRemoteImages && !useProxy) {
                removeProtonPrefix(match);
            }
        }

        let url = '';

        ATTRIBUTES.some((attribute) => {
            url = match.getAttribute(`proton-${attribute}`) || '';
            return url && url !== '';
        });

        if (!url && match.hasAttribute('style') && match.getAttribute('style')?.includes('proton-url')) {
            const styleContent = match.getAttribute('style');
            if (styleContent !== null) {
                const nextUrl = styleContent.match(/proton-url\((.*?)\)/)?.[1].replace(/('|")/g, '');
                if (nextUrl) {
                    url = nextUrl;
                }
            }
        }

        remoteImages.push({
            type: 'remote',
            url,
            original: match,
            id,
            tracker: undefined,
            status: 'not-loaded',
        });
    });

    if (skipProxy) {
        void loadSkipProxyImages(remoteImages, onLoadRemoteImagesDirect);
    } else if (showRemoteImages) {
        void loadRemoteImages(useProxy, remoteImages, onLoadRemoteImagesDirect, onLoadRemoteImagesProxy);
    } else if (useProxy && onLoadFakeImagesProxy) {
        void loadFakeImages(remoteImages, onLoadFakeImagesProxy);
    }

    return {
        document,
        showRemoteImages: hasRemoteImages ? showRemoteImages : undefined,
        remoteImages,
        hasRemoteImages,
    };
};

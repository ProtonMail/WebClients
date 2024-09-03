import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { hasShowRemote } from '@proton/shared/lib/mail/images';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';
import { isDraft } from '@proton/shared/lib/mail/messages';
import generateUID from '@proton/utils/generateUID';

import { removeLineBreaks } from 'proton-mail/helpers/string';

import type { MessageRemoteImage, MessageState } from '../../store/messages/messagesTypes';
import { querySelectorAll } from '../message/messageContent';
import { getRemoteImages, insertImageAnchor } from '../message/messageImages';
import {
    ATTRIBUTES_TO_FIND,
    ATTRIBUTES_TO_LOAD,
    hasToSkipProxy,
    loadFakeImages,
    loadRemoteImages,
    loadSkipProxyImages,
    removeProtonPrefix,
} from '../message/messageRemotes';

const SELECTOR = ATTRIBUTES_TO_FIND.map((name) => {
    if (name === 'src') {
        return '[proton-src]:not([proton-src^="cid"]):not([proton-src^="data"])';
    }

    // https://stackoverflow.com/questions/23034283/is-it-possible-to-use-htmls-queryselector-to-select-by-xlink-attribute-in-an
    if (name === 'xlink:href') {
        return '[*|href]:not([href])';
    }

    return `[proton-${name}]`;
}).join(',');

export const getRemoteImageMatches = (message: MessageState) => {
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
    mailSettings: Partial<MailSettings>,
    onLoadRemoteImagesDirect: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadRemoteImagesProxy?: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadFakeImagesProxy?: (imagesToLoad: MessageRemoteImage[], firstLoad?: boolean) => void
) => {
    const showRemoteImages =
        message.messageImages?.showRemoteImages || hasShowRemote(mailSettings) || !!message.data?.Sender?.IsProton;

    const draft = isDraft(message.data);

    const useProxy = hasBit(mailSettings.ImageProxy, IMAGE_PROXY_FLAGS.PROXY);

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
            }
        }

        // If the user do not want to use the proxy at all, we can remove all proton prefix in drafts
        // This will load all images
        if (draft && showRemoteImages && !useProxy) {
            removeProtonPrefix(match);
        }

        let url = '';

        ATTRIBUTES_TO_LOAD.some((attribute) => {
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

        // Some elements might not have a URL at this point, e.g. img tag with only a srcset attribute
        // We don't want to display an error placeholder, so we don't add them
        if (url) {
            try {
                // Some URLs cannot be loaded because they are encoded, and they do contain line breaks at the end of the string
                // To prevent errors, we are decoding the url and removing potential line breaks.
                const cleanedURL = removeLineBreaks(decodeURI(url));

                remoteImages.push({
                    type: 'remote',
                    url: cleanedURL,
                    original: match,
                    id,
                    tracker: undefined,
                    status: 'not-loaded',
                });
            } catch {
                remoteImages.push({
                    type: 'remote',
                    url,
                    original: match,
                    id,
                    tracker: undefined,
                    status: 'not-loaded',
                });
            }
        }
    });

    if (skipProxy) {
        void loadSkipProxyImages(remoteImages, onLoadRemoteImagesDirect);
    } else if (showRemoteImages) {
        // Beware because we also pass here when loading images in EO
        // Load images through proxy, by forging the URL and putting it directly into the image src
        void loadRemoteImages(useProxy, remoteImages, onLoadRemoteImagesDirect, onLoadRemoteImagesProxy);
        // Make a fake load of images to check if they are trackers
        if (useProxy && onLoadFakeImagesProxy) {
            void loadFakeImages(remoteImages, onLoadFakeImagesProxy);
        }
    } else if (useProxy && onLoadFakeImagesProxy) {
        void loadFakeImages(remoteImages, onLoadFakeImagesProxy, true);
    }

    // We might found images elements that we do not add to remote images, e.g. img tag with only a srcset attribute
    const containsRemoteImages = hasRemoteImages && remoteImages.length > 0;

    return {
        document,
        showRemoteImages: containsRemoteImages ? showRemoteImages : undefined,
        remoteImages,
        hasRemoteImages: containsRemoteImages,
    };
};

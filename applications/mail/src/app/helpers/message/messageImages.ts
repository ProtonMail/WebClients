import { getImage } from '@proton/shared/lib/api/images';
import { createUrl } from '@proton/shared/lib/fetch/helpers';

import {
    MessageEmbeddedImage,
    MessageImage,
    MessageImages,
    MessageRemoteImage,
    MessageState,
    PartialMessageState,
} from '../../logic/messages/messagesTypes';
import { getDocumentContent, setDocumentContent } from './messageContent';
import { setEmbeddedAttr } from './messageEmbeddeds';
import { ATTRIBUTES_TO_LOAD } from './messageRemotes';

const REGEXP_FIXER = (() => {
    const str = ATTRIBUTES_TO_LOAD.map((key) => `proton-${key}`).join('|');
    return `(${str})`;
})();

export const getRemoteSelector = (hasProtonAttribute = false) => {
    return ATTRIBUTES_TO_LOAD.map((name) => {
        // https://stackoverflow.com/questions/23034283/is-it-possible-to-use-htmls-queryselector-to-select-by-xlink-attribute-in-an
        if (name === 'xlink:href') {
            return '[*|href]:not([href])';
        }

        return `[${hasProtonAttribute ? 'proton-' : ''}${name}]`;
    }).join(',');
};

export const getAnchor = (document: Element | null | undefined, image: MessageImage) => {
    if (!document) {
        return null;
    }

    return document.querySelector(
        `.proton-image-anchor[data-proton-${image.type}="${image.id}"]`
    ) as HTMLElement | null;
};

export const getRemoteImages = ({ messageImages }: PartialMessageState) =>
    (messageImages?.images.filter(({ type }) => type === 'remote') || []) as MessageRemoteImage[];

export const getEmbeddedImages = ({ messageImages }: PartialMessageState) =>
    (messageImages?.images.filter(({ type }) => type === 'embedded') || []) as MessageEmbeddedImage[];

export const updateImages = (
    original: MessageImages | undefined,
    flagChanges: Partial<Omit<MessageImages, 'images'>> | undefined,
    remoteImages: MessageRemoteImage[] | undefined,
    embeddedImages: MessageEmbeddedImage[] | undefined
): MessageImages => {
    const messageImages: MessageImages = {
        ...{
            hasRemoteImages: false,
            hasEmbeddedImages: false,
            showRemoteImages: false,
            showEmbeddedImages: false,
            images: [],
        },
        ...(original || {}),
        ...(flagChanges || {}),
    };
    const remotes = getRemoteImages({ messageImages });
    const embeddeds = getEmbeddedImages({ messageImages });
    const images = [
        ...(remoteImages !== undefined ? remoteImages : remotes),
        ...(embeddedImages !== undefined ? embeddedImages : embeddeds),
    ];
    return { ...messageImages, images };
};

export const insertImageAnchor = (id: string, type: 'remote' | 'embedded', match: HTMLElement): string => {
    const anchor = document.createElement('span');
    anchor.classList.add('proton-image-anchor');
    anchor.setAttribute(`data-proton-${type}`, id);
    match.parentElement?.replaceChild(anchor, match);
    return id;
};

export const restoreImages = (inputDocument: Element | undefined, images: MessageImages | undefined) => {
    if (!inputDocument || !images) {
        return inputDocument;
    }

    const document = inputDocument.cloneNode(true) as Element;
    const { showEmbeddedImages, showRemoteImages } = images;

    images.images.forEach((image) => {
        const anchor = getAnchor(document, image);
        const parent = anchor?.parentElement;
        const { original } = image;
        if (!anchor || !parent || !original) {
            return;
        }
        if (image.type === 'embedded') {
            setEmbeddedAttr(image.cid, image.cloc, original);

            original.classList.add('proton-embedded');

            if (showEmbeddedImages) {
                original.setAttribute('src', image?.url || '');
            }
        }
        if (image.type === 'remote') {
            if (showRemoteImages) {
                original.setAttribute('src', image?.url || '');
            }
        }
        parent.replaceChild(original, anchor);
    });

    return document;
};

/**
 * Restore all prefixed attributes
 */
export const restoreAllPrefixedAttributes = (content: string) => {
    const regex = new RegExp(REGEXP_FIXER, 'g');
    return content.replace(regex, (_, $1) => $1.substring(7));
};

/**
 * Remove all "normal" HTML attributes that we filled with our values (e.g. images src with proxyfied urls)
 */
export const removeProxyURLAttributes = (content: string, messageImages: MessageImages | undefined) => {
    if (!messageImages || !messageImages.hasRemoteImages || !(messageImages.images.length > 0)) {
        return content;
    }

    const document = setDocumentContent(window.document.createElement('div'), content);

    const foundElements = document.querySelectorAll(getRemoteSelector());

    foundElements.forEach((element) => {
        ATTRIBUTES_TO_LOAD.forEach((attr) => {
            if (element.hasAttribute(attr)) {
                const elementURL = element.getAttribute(attr);
                const elementProtonURL = element.getAttribute(`proton-${attr}`);

                /**
                 * We want to remove the src only if it's a proxy one before send
                 * It's a proxy url when
                 * - The image is a remote, because we don't want to remove any embedded images src
                 * - When the current element has a src + a proton-src attribute (or other background, url, etc...)
                 *
                 * Normally, "originalURL" is defined when we use the proxy. It will contain the image default distant URL
                 * And "url" will then contain the proxy URL from Proton
                 *
                 * So, if the image.url is equal to the one in the src attribute, and the proton-src attribute equals the image original url
                 * Then it means "src" contains the proxy url and "proton-src" the original URL.
                 * We can remove the src so that we will use proton-src (which will be transformed to a src later) for sending
                 * */
                if (!elementProtonURL) {
                    return;
                }

                const imageFromState = messageImages.images.find((img) => {
                    if (img.type !== 'remote' || !img.originalURL) {
                        return false;
                    }
                    return img.url === elementURL && elementProtonURL === img.originalURL;
                });

                if (imageFromState) {
                    element.removeAttribute(attr);
                }
            }
        });
    });

    return document.innerHTML;
};

/**
 * Clean remotes images from the message.
 * At this point images might have a proton-src attribute, containing the original URL of the images
 * AND a src attribute containing the proxified URL of the image
 *
 * However, we want to send the original URL, so we need to remove the proxified URL + transform proton-src to src
 */
export const replaceProxyWithOriginalURLAttributes = (message: MessageState, document: Element) => {
    let content = getDocumentContent(document);

    // First step, remove all src on images that are using Proton proxy urls
    content = removeProxyURLAttributes(content, message?.messageImages);

    // Step two, transform all proton-src (and others) attributes to src, since it contains the original URL of the image
    // Normally, removing a proxy url should be associated with transforming a proton-src attribute to src at the same time
    // However, I'm not 100% we could not have cases where there is a proton-src in the message and no associated proxy url
    // In that case the image would be broken on the recipient side, so I prefer doing it separately
    content = restoreAllPrefixedAttributes(content);

    return content;
};

export const forgeImageURL = (url: string, uid: string) => {
    const config = getImage(url, 0, uid);
    const prefixedUrl = `api/${config.url}`; // api/ is required to set the AUTH cookie
    const urlToLoad = createUrl(prefixedUrl, config.params);
    return urlToLoad.toString();
};

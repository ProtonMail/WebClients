import type { PrivateAuthenticationStore } from '@proton/components';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { Api } from '@proton/shared/lib/interfaces';
import uniqueBy from '@proton/utils/uniqueBy';

import {
    loadFakeProxy,
    loadRemoteDirectFromURL,
    loadRemoteProxyFromURL,
} from '../../store/messages/images/messagesImagesActions';
import type {
    LoadRemoteResults,
    MessageEmbeddedImage,
    MessageImage,
    MessageImages,
    MessageRemoteImage,
    MessageState,
    PartialMessageState,
} from '../../store/messages/messagesTypes';
import { getDocumentContent } from './messageContent';
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
            trackersStatus: 'not-loaded',
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
export const removeProxyURLAttributes = (content: string) => {
    // Using create element will create a DOM element that will not be added to the window's document, but images will be loaded
    // Use a DOMParser instead so that images are not loaded.
    const document = parseStringToDOM(content);

    const foundElements = document.querySelectorAll(getRemoteSelector());

    foundElements.forEach((element) => {
        ATTRIBUTES_TO_LOAD.forEach((attr) => {
            if (element.hasAttribute(attr)) {
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

                element.setAttribute(attr, elementProtonURL);
                element.removeAttribute(`proton-${attr}`);
            }
        });
    });

    return document.body.innerHTML;
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
    content = removeProxyURLAttributes(content);

    // Step two, transform all proton-src (and others) attributes to src, since it contains the original URL of the image
    // Normally, removing a proxy url should be associated with transforming a proton-src attribute to src at the same time
    // However, I'm not 100% we could not have cases where there is a proton-src in the message and no associated proxy url
    // In that case the image would be broken on the recipient side, so I prefer doing it separately
    content = restoreAllPrefixedAttributes(content);

    return content;
};

export const handleDispatchLoadImagesProxy = (
    ID: string,
    imagesToLoad: MessageRemoteImage[],
    authentication: PrivateAuthenticationStore,
    dispatch: (action: any) => void
) => {
    const dispatchResult = dispatch(loadRemoteProxyFromURL({ ID, imagesToLoad, uid: authentication.getUID() }));
    return dispatchResult as any as Promise<LoadRemoteResults[]>;
};

export const handleDispatchLoadFakeImagesProxy = (
    ID: string,
    imagesToLoad: MessageRemoteImage[],
    api: Api,
    dispatch: (action: any) => void,
    firstLoad?: boolean
) => {
    // Make one call per image, it's possible that several images in the message have the same URL.
    const uniqueImages = uniqueBy(imagesToLoad, (image) => image.url);
    const dispatchResult = dispatch(loadFakeProxy({ ID, imagesToLoad: uniqueImages, api, firstLoad }));
    return dispatchResult as any as Promise<LoadRemoteResults[]>;
};

export const handleDispatchLoadRemoteImagesDirect = (
    ID: string,
    imagesToLoad: MessageRemoteImage[],
    dispatch: (action: any) => void
) => {
    const dispatchResult = dispatch(loadRemoteDirectFromURL({ ID, imagesToLoad }));
    return dispatchResult as any as Promise<LoadRemoteResults[]>;
};

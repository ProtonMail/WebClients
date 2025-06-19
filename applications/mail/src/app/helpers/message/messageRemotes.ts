import { MESSAGE_IMAGE_ATTRIBUTES_TO_LOAD } from '@proton/mail/constants';
import type { MessageImage, MessageRemoteImage } from '@proton/mail/store/messages/messagesTypes';
import { wait } from '@proton/shared/lib/helpers/promise';

import { getRemoteSelector } from './messageImages';

export const urlCreator = () => window.URL || window.webkitURL;

export const removeProtonPrefix = (match: HTMLElement) => {
    MESSAGE_IMAGE_ATTRIBUTES_TO_LOAD.forEach((attr) => {
        const protonAttr = `proton-${attr}`;
        if (match.hasAttribute(protonAttr)) {
            match.setAttribute(attr, match.getAttribute(protonAttr) as string);
            match.removeAttribute(protonAttr);
        }
    });
};

interface LoadBackgroundImagesProps {
    images?: MessageRemoteImage[];
    document?: Element;
}

export const loadBackgroundImages = ({ images, document }: LoadBackgroundImagesProps) => {
    if (!document || !images) {
        return;
    }
    const elementWithStyleTag = document?.querySelectorAll('[style]');

    elementWithStyleTag?.forEach((element) => {
        const styleAttribute = element.getAttribute('style');

        if (styleAttribute && styleAttribute.includes('proton-url')) {
            const rawUrlMatch = styleAttribute.match(/proton-url\((.*?)\)/)?.[1];
            const cleanUrlMatch = rawUrlMatch?.replace(/('|")/g, '');

            // Find the corresponding image to get its url (same url if loading without proxy, or blob if loading through proxy)
            const preLoadedImage = images.find((img) => cleanUrlMatch === img.originalURL);

            // Set attribute with the right URL (normal or blob depending on the setting)
            if (preLoadedImage && preLoadedImage.url && rawUrlMatch) {
                element.setAttribute(
                    'style',
                    styleAttribute.replace(rawUrlMatch, preLoadedImage.url).replace('proton-url', 'url')
                );
            }
        }
    });
};

/**
 * Search for proton attributes in the document and replace them with their normal attributes
 * =>  e.g. proton-src becomes src so that we can load an image
 *
 * It should work on img tags and other elements from ATTRIBUTE_TO_LOAD (e.g. url, background, etc...)
 */
export const loadImages = (images: MessageRemoteImage[], messageDocument?: Element) => {
    const selector = getRemoteSelector(true);

    // Get all elements in the mail which have a proton attribute
    const foundElements = messageDocument ? messageDocument.querySelectorAll(selector) : [];

    foundElements.forEach((element) => {
        MESSAGE_IMAGE_ATTRIBUTES_TO_LOAD.forEach((attr) => {
            const protonAttr = `proton-${attr}`;
            if (element.hasAttribute(protonAttr)) {
                const elementValue = element.getAttribute(protonAttr) as string;

                // Find the corresponding image to get its url (same url if loading without proxy, or blob if loading through proxy)
                // Check its originalUrl because url field can be a blob at this point
                images.forEach((el) => {
                    if (elementValue === el.originalURL && el.url) {
                        // Set attribute with the right URL (normal or blob depending on the setting)
                        element.setAttribute(attr, el.url);
                    }
                });
            }
        });
    });
};

// Error Code 2902 means proxy failed to load the image
const imageFailedWithProxy = (image: MessageRemoteImage) => (image.error as any)?.data?.Code === 2902 && !image.tracker;

export const hasToSkipProxy = (images: MessageImage[] = []) => {
    const remoteImages = images.filter((image) => image.type === 'remote') as MessageRemoteImage[];
    return remoteImages.every((image) => image.status === 'loaded') && remoteImages.some(imageFailedWithProxy);
};

export const loadRemoteImages = async (
    useProxy: boolean,
    images: MessageRemoteImage[],
    onLoadRemoteImagesDirect: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadRemoteImagesProxy?: (imagesToLoad: MessageRemoteImage[]) => void
) => {
    // Not really happy with this hack but we need to "wait" that the message transform process is finished
    // And update the message cache before updating image statuses
    await wait(0);

    const imagesToLoad = images.filter((image) => image.status === 'not-loaded');

    if (useProxy) {
        return onLoadRemoteImagesProxy?.(imagesToLoad);
    }
    return onLoadRemoteImagesDirect(imagesToLoad);
};

export const loadFakeImages = async (
    images: MessageRemoteImage[],
    onLoadFakeImagesProxy: (imagesToLoad: MessageRemoteImage[], firstLoad?: boolean) => void,
    firstLoad = false
) => {
    // Not really happy with this hack but we need to "wait" that the message transform process is finished
    // And update the message cache before updating image statuses
    await wait(0);

    return onLoadFakeImagesProxy(images, firstLoad);
};

export const loadSkipProxyImages = async (
    images: MessageRemoteImage[],
    onLoadRemoteImagesDirect: (imagesToLoad: MessageRemoteImage[]) => void
) => {
    // Not really happy with this hack but we need to "wait" that the message transform process is finished
    // And update the message cache before updating image statuses
    await wait(0);

    const imagesToLoad = images.filter(imageFailedWithProxy);

    return onLoadRemoteImagesDirect(imagesToLoad);
};

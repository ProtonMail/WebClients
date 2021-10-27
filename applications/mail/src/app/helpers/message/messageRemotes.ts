import { wait } from '@proton/shared/lib/helpers/promise';
import { MessageRemoteImage } from '../../logic/messages/messagesTypes';

export const ATTRIBUTES = ['url', 'xlink:href', 'srcset', 'src', 'svg', 'background', 'poster'];

export const urlCreator = () => window.URL || window.webkitURL;

export const removeProtonPrefix = (match: HTMLElement) => {
    ATTRIBUTES.forEach((attr) => {
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

export const loadElementOtherThanImages = (images: MessageRemoteImage[], messageDocument?: Element) => {
    const elementOtherThanImages = images.filter((image) => image.original?.tagName !== 'IMG');

    const selector = ATTRIBUTES.map((name) => {
        // https://stackoverflow.com/questions/23034283/is-it-possible-to-use-htmls-queryselector-to-select-by-xlink-attribute-in-an
        if (name === 'xlink:href') {
            return '[*|href]:not([href])';
        }

        return `[proton-${name}]`;
    }).join(',');

    // Get all elements in the mail which have a proton attribute
    const foundElements = messageDocument ? messageDocument.querySelectorAll(selector) : [];

    foundElements.forEach((element) => {
        ATTRIBUTES.forEach((attr) => {
            const protonAttr = `proton-${attr}`;
            if (element.hasAttribute(protonAttr)) {
                const elementValue = element.getAttribute(protonAttr) as string;

                // Find the corresponding image to get its url (same url if loading without proxy, or blob if loading through proxy)
                const elementWithOriginalURL = elementOtherThanImages.find((el) => {
                    return elementValue === el.url;
                });

                // Set attribute with the right URL (normal or blob depending on the setting)
                if (elementWithOriginalURL && elementWithOriginalURL.url) {
                    element.setAttribute(attr, elementWithOriginalURL.url);
                }

                element.removeAttribute(protonAttr);
            }
        });
    });
};

export const loadRemoteImages = async (
    useProxy: boolean,
    images: MessageRemoteImage[],
    onLoadRemoteImagesProxy: (imagesToLoad: MessageRemoteImage[]) => void,
    onLoadRemoteImagesDirect: (imagesToLoad: MessageRemoteImage[]) => void
) => {
    // Not really happy with this hack but we need to "wait" that the message transform process is finished
    // And update the message cache before updating image statuses
    await wait(0);

    const imagesToLoad = images.filter((image) => image.status === 'not-loaded');

    if (useProxy) {
        return onLoadRemoteImagesProxy(imagesToLoad);
    }
    return onLoadRemoteImagesDirect(imagesToLoad);
};

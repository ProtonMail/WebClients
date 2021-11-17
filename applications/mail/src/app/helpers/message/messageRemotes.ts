import { getImage } from '@proton/shared/lib/api/images';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Api } from '@proton/shared/lib/interfaces';
import { MessageCache, updateMessageCache } from '../../containers/MessageProvider';
import { MessageRemoteImage } from '../../models/message';
import { getRemoteImages, updateImages } from './messageImages';
import { preloadImage } from '../dom';

export const ATTRIBUTES = ['url', 'xlink:href', 'srcset', 'src', 'svg', 'background', 'poster'];
const urlCreator = () => window.URL || window.webkitURL;

const updateRemoteImages = (messageCache: MessageCache, localID: string, images: MessageRemoteImage[]) => {
    const message = messageCache.get(localID);
    if (!message || !message.messageImages) {
        return;
    }
    const currentImages = getRemoteImages(message);
    const updatedImages = currentImages.map(
        (currentImage) => images.find((image) => image.id === currentImage.id) || currentImage
    );
    const messageImages = updateImages(message.messageImages, undefined, updatedImages, undefined);
    updateMessageCache(messageCache, localID, { messageImages });
};

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
                    return elementValue === el.originalURL;
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

const loadImagesWithoutProxy = async (
    localID: string,
    images: MessageRemoteImage[],
    messageCache: MessageCache,
    messageDocument?: Element
) => {
    const imagesToLoad = images.filter((image) => image.status === 'not-loaded');

    const promises = Promise.all(
        imagesToLoad.map(async (image): Promise<[MessageRemoteImage, unknown]> => {
            try {
                await preloadImage(image.url as string);
                return [image, undefined];
            } catch (error) {
                return [image, error];
            }
        })
    );

    const imagesLoading = imagesToLoad.map((image) => ({ ...image, status: 'loading' as 'loading' }));

    updateRemoteImages(messageCache, localID, imagesLoading);

    const results = await promises;

    imagesToLoad.forEach((image) => {
        removeProtonPrefix(image.original as HTMLElement);
    });

    const imagesLoaded = results.map(([image, error]) => ({
        ...image,
        originalURL: image.url,
        error,
        status: 'loaded' as 'loaded',
    }));

    loadElementOtherThanImages(imagesLoaded, messageDocument);

    loadBackgroundImages({ document: messageDocument, images: imagesLoaded });

    updateMessageCache(messageCache, localID, { document: messageDocument });

    updateRemoteImages(messageCache, localID, imagesLoaded);
};

const loadImagesThroughProxy = async (
    localID: string,
    images: MessageRemoteImage[],
    messageCache: MessageCache,
    api: Api,
    messageDocument?: Element
) => {
    const imagesToLoad = images.filter((image) => image.status === 'not-loaded');

    const promises = Promise.all(
        imagesToLoad.map(async (image) => {
            if (!image.url) {
                return { image, error: 'No URL' };
            }

            try {
                const response: Response = await api({
                    ...getImage(image.url as string),
                    output: 'raw',
                    silence: true,
                });

                return {
                    image,
                    blob: await response.blob(),
                    tracker: response.headers.get('x-pm-tracker-provider') || '',
                };
            } catch (error) {
                return { image, error };
            }
        })
    );

    const imagesLoading = imagesToLoad.map((image) => ({ ...image, url: undefined, status: 'loading' as 'loading' }));

    updateRemoteImages(messageCache, localID, imagesLoading);

    const results = await promises;

    const imagesLoaded = results.map(({ image, blob, tracker, error }) => ({
        ...image,
        originalURL: image.url,
        url: blob ? urlCreator().createObjectURL(blob) : undefined,
        error,
        tracker,
        status: 'loaded' as 'loaded',
    }));

    loadElementOtherThanImages(imagesLoaded, messageDocument);

    loadBackgroundImages({ document: messageDocument, images: imagesLoaded });

    updateMessageCache(messageCache, localID, { document: messageDocument });

    updateRemoteImages(messageCache, localID, imagesLoaded);
};

export const loadRemoteImages = async (
    useProxy: boolean,
    localID: string,
    images: MessageRemoteImage[],
    messageCache: MessageCache,
    api: Api,
    messageDocument?: Element
) => {
    // Not really happy with this hack but we need to "wait" that the message transform process is finished
    // And update the message cache before updating image statuses
    await wait(0);

    if (useProxy) {
        return loadImagesThroughProxy(localID, images, messageCache, api, messageDocument);
    }
    return loadImagesWithoutProxy(localID, images, messageCache, messageDocument);
};

export const loadFakeThroughProxy = async (
    localID: string,
    images: MessageRemoteImage[],
    messageCache: MessageCache,
    api: Api
) => {
    // Not really happy with this hack but we need to "wait" that the message transform process is finished
    // And update the message cache before updating image statuses
    await wait(0);

    const results = await Promise.all(
        images
            .filter((image) => image.tracker === undefined)
            .map(async (image) => {
                if (!image.url) {
                    return { image, error: 'No URL' };
                }

                try {
                    const response: Response = await api({
                        ...getImage(image.url as string, 1),
                        output: 'raw',
                        silence: true,
                    });

                    return {
                        image,
                        tracker: response.headers.get('x-pm-tracker-provider') || '',
                    };
                } catch (error) {
                    return { image, error };
                }
            })
    );

    const imagesLoaded = results.map(({ image, tracker, error }) => ({
        ...image,
        error,
        originalURL: image.url,
        tracker,
    }));

    updateRemoteImages(messageCache, localID, imagesLoaded);
};

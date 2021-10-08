import { getImage } from '@proton/shared/lib/api/images';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Api } from '@proton/shared/lib/interfaces';
import { MessageCache, updateMessageCache } from '../../containers/MessageProvider';
import { MessageRemoteImage } from '../../models/message';
import { getRemoteImages, updateImages } from './messageImages';

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

const preloadImage = async (url: string) =>
    new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.src = url;
        img.onload = resolve;
        img.onerror = reject;
    });

export const removeProtonPrefix = (match: HTMLElement) => {
    ATTRIBUTES.forEach((attr) => {
        const protonAttr = `proton-${attr}`;
        if (match.hasAttribute(protonAttr)) {
            match.setAttribute(attr, match.getAttribute(protonAttr) as string);
            match.removeAttribute(protonAttr);
        }
    });
};

const loadImagesWithoutProxy = async (localID: string, images: MessageRemoteImage[], messageCache: MessageCache) => {
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

    const imagesLoaded = results.map(([image, error]) => ({ ...image, error, status: 'loaded' as 'loaded' }));

    updateRemoteImages(messageCache, localID, imagesLoaded);
};

const loadImagesThroughProxy = async (
    localID: string,
    images: MessageRemoteImage[],
    messageCache: MessageCache,
    api: Api
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
                    // Warning: in local dev it will not work due to CORS limitations
                    // https://stackoverflow.com/questions/43344819/reading-response-headers-with-fetch-api#44816592
                    tracker: response.headers.get('x-pm-tracker-provider') || undefined,
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
        url: blob ? urlCreator().createObjectURL(blob) : undefined,
        error,
        tracker,
        status: 'loaded' as 'loaded',
    }));

    updateRemoteImages(messageCache, localID, imagesLoaded);
};

export const loadRemoteImages = async (
    useProxy: boolean,
    localID: string,
    images: MessageRemoteImage[],
    messageCache: MessageCache,
    api: Api
) => {
    // Not really happy with this hack but we need to "wait" that the message transform process is finished
    // And update the message cache before updating image statuses
    await wait(0);

    if (useProxy) {
        return loadImagesThroughProxy(localID, images, messageCache, api);
    }
    return loadImagesWithoutProxy(localID, images, messageCache);
};

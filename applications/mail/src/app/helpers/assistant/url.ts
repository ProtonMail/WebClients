import { encodeImageUri, forgeImageURL } from '@proton/shared/lib/helpers/image';

import { API_URL } from 'proton-mail/config';

const LinksURLs: {
    [key: string]: {
        messageID: string;
        url: string;
        class?: string;
        style?: string;
    };
} = {};
const ImageURLs: {
    [key: string]: {
        messageID: string;
        src: string;
        'proton-src'?: string;
        class?: string;
        style?: string;
        id?: string;
        'data-embedded-img'?: string;
    };
} = {};
export const ASSISTANT_IMAGE_PREFIX = '^'; // Prefix to generate unique IDs
let indexURL = 0; // Incremental index to generate unique IDs

// Replace URLs by a unique ID and store the original URL
export const replaceURLs = (dom: Document, uid: string, messageID: string): Document => {
    // Find all links in the DOM
    const links = dom.querySelectorAll('a[href]');

    // Replace URLs in links
    links.forEach((link) => {
        const hrefValue = link.getAttribute('href') || '';
        const classValue = link.getAttribute('class');
        const styleValue = link.getAttribute('style');
        if (hrefValue) {
            const key = `${ASSISTANT_IMAGE_PREFIX}${indexURL++}`;
            LinksURLs[key] = {
                messageID,
                url: hrefValue,
                class: classValue ? classValue : undefined,
                style: styleValue ? styleValue : undefined,
            };
            link.setAttribute('href', key);
        }
    });

    /**
     * We also want to search for images, however we need to put additional logic here.
     * #### REMOTE IMAGE ####
     * Since often proxy images to avoid IP leak from the user, we have multiple cases:
     * 1- Image has a "src" attribute only
     *          => User added a remote image in the composer, OR do not have the setting load images with proxy
     * 2- Image has a "proton-src" attribute only
     *          => This happens when opening an old draft (when setting is set to load with proxy).
     *          The "real" image url in src attribute is prefixed with "proton", so that it does not get loaded,
     *          which could leak user IP. So in that case, the image is not loaded, but still present in the DOM.
     *          When sending, we will remove the attribute on the fly, so the image will be sent.
     *          This behaviour needs to be improved in the future.
     * 3- Image has both "proton-src" and "src" attributes
     *          => This happens when you reply to a message that had images loaded.
     *          Basically, the image is shown in the composer using the proxy url, and we will replace it with the true url
     *          on the fly before sending.
     *
     *
     * The goal to keep images properly formatted with a refine is to keep as much information as possible (src, proton-src, class)
     * Also, we would like to load images that are not loaded when clicking on refine,
     * otherwise we would get broken images in the generation, which is something we would like to avoid.
     *
     * To do so, here is what we are doing:
     * 1- We search for all images with src attributes
     *      a- If image also has proton-src attribute, then we can add src, proton-src (and class if any) to our "ImageURLs" object
     *      b- If image has no proton-src, it's already loaded, so we can store it directly without additional manipulation
     * 2- We search for images wit proton-src attributes.
     *      - If image also has a src attribute, then we already made what was needed in 1.a.
     *      - If no src attribute, then the image is not loaded. What we do is the following:
     *          - We store proton-src
     *          - We proxy this url and store it in src, so that we'll be able to load the image without leaking user IP.
     *
     *
     * #### EMBEDDED IMAGE ####
     * Embedded images are also identified by a "data-embedded-img" and "id" attribute.
     * So during the previous check, we are also storing these values
     */
    const images = dom.querySelectorAll('img[src]');
    const protonSrcImages = dom.querySelectorAll('img[proton-src]');

    images.forEach((image) => {
        const srcValue = image.getAttribute('src');
        const protonSrcValue = image.getAttribute('proton-src');
        const classValue = image.getAttribute('class');
        const styleValue = image.getAttribute('style');
        const dataValue = image.getAttribute('data-embedded-img');
        const idValue = image.getAttribute('id');

        const commonAttributes = {
            class: classValue ? classValue : undefined,
            style: styleValue ? styleValue : undefined,
            'data-embedded-img': dataValue ? dataValue : undefined,
            id: idValue ? idValue : undefined,
        };
        if (srcValue && protonSrcValue) {
            const key = `${ASSISTANT_IMAGE_PREFIX}${indexURL++}`;
            ImageURLs[key] = {
                messageID,
                src: srcValue,
                'proton-src': protonSrcValue,
                ...commonAttributes,
            };
            image.setAttribute('src', key);
        } else if (srcValue) {
            const key = `${ASSISTANT_IMAGE_PREFIX}${indexURL++}`;
            ImageURLs[key] = {
                messageID,
                src: srcValue,
                ...commonAttributes,
            };
            image.setAttribute('src', key);
        }
    });

    protonSrcImages.forEach((image) => {
        const srcValue = image.getAttribute('src');
        const protonSrcValue = image.getAttribute('proton-src');
        const classValue = image.getAttribute('class');
        const dataValue = image.getAttribute('data-embedded-img');
        const idValue = image.getAttribute('id');
        if (srcValue && protonSrcValue) {
            return;
        } else if (protonSrcValue) {
            const key = `${ASSISTANT_IMAGE_PREFIX}${indexURL++}`;
            const encodedImageUrl = encodeImageUri(protonSrcValue);
            const proxyImage = forgeImageURL({
                apiUrl: API_URL,
                url: encodedImageUrl,
                uid,
                origin: window.location.origin,
            });

            ImageURLs[key] = {
                messageID,
                src: proxyImage,
                'proton-src': protonSrcValue,
                class: classValue ? classValue : undefined,
                'data-embedded-img': dataValue ? dataValue : undefined,
                id: idValue ? idValue : undefined,
            };
            image.setAttribute('src', key);
        }
    });

    return dom;
};

// Restore URLs (in links and images) from unique IDs
export const restoreURLs = (dom: Document, messageID: string): Document => {
    // Find all links and image in the DOM
    const links = dom.querySelectorAll('a[href]');
    const images = dom.querySelectorAll('img[src]');

    // Before replacing urls, we are making sure the link has the correct messageID.
    // We want to avoid cases where the model would refine using another placeholder ID that would already exist for another message
    // This would lead to insert in the wrong message a link, which could be a privacy issue

    // Restore URLs in links
    links.forEach((link) => {
        // We need to decode the href because the placeholder "^" is being encoded during markdown > html conversion
        const hrefValue = decodeURIComponent(link.getAttribute('href') || '');
        if (hrefValue) {
            if (LinksURLs[hrefValue]?.url && LinksURLs[hrefValue]?.messageID === messageID) {
                link.setAttribute('href', LinksURLs[hrefValue].url);
                if (LinksURLs[hrefValue].class) {
                    link.setAttribute('class', LinksURLs[hrefValue].class);
                }
                if (LinksURLs[hrefValue].style) {
                    link.setAttribute('style', LinksURLs[hrefValue].style);
                }
            } else {
                // Replace the link with its inner content
                const parent = link.parentNode;
                if (parent) {
                    // Move all children of the link before the link
                    while (link.firstChild) {
                        parent.insertBefore(link.firstChild, link);
                    }
                    // Then remove the empty link
                    parent.removeChild(link);
                }
            }
        }
    });

    // Restore URLs in images
    images.forEach((image) => {
        // We need to decode the href because the placeholder "^" is being encoded during markdown > html conversion
        const srcValue = decodeURIComponent(image.getAttribute('src') || '');
        if (srcValue) {
            if (ImageURLs[srcValue] && ImageURLs[srcValue]?.messageID === messageID) {
                image.setAttribute('src', ImageURLs[srcValue].src);
                if (ImageURLs[srcValue]['proton-src']) {
                    image.setAttribute('proton-src', ImageURLs[srcValue]['proton-src']);
                }
                if (ImageURLs[srcValue].class) {
                    image.setAttribute('class', ImageURLs[srcValue].class);
                }
                if (ImageURLs[srcValue].style) {
                    image.setAttribute('style', ImageURLs[srcValue].style);
                }
                if (ImageURLs[srcValue]['data-embedded-img']) {
                    image.setAttribute('data-embedded-img', ImageURLs[srcValue]['data-embedded-img']);
                }
                if (ImageURLs[srcValue].id) {
                    image.setAttribute('id', ImageURLs[srcValue].id);
                }
            } else {
                image.remove();
            }
        }
    });

    return dom;
};

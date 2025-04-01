import type { MailSettings } from '@proton/shared/lib/interfaces';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

export const hasShowEmbedded = ({ HideEmbeddedImages }: Partial<MailSettings> = {}) =>
    HideEmbeddedImages === SHOW_IMAGES.SHOW;

export const hasShowRemote = ({ HideRemoteImages }: Partial<MailSettings> = {}) =>
    HideRemoteImages === SHOW_IMAGES.SHOW;

/** Helper which is replacing images proxy url from a document with original urls */
export const removeProxyUrlsFromContent = (content: Document) => {
    const contentImages = content.querySelectorAll('img');

    // Replace all proxy images with their original URL
    contentImages.forEach((img) => {
        const isProxyUrl = img.src.includes('core/v4/images');
        if (isProxyUrl) {
            // In proxy URLs, image original URL is passed in "Url" search param
            const originalUrl = new URL(img.src).searchParams.get('Url');
            if (originalUrl) {
                img.src = originalUrl;
            }
        }
    });

    return content;
};

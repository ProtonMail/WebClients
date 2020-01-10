import { MessageExtended } from '../../models/message';
import { escapeSrc, unescapeSrc, wrap } from '../dom';
import { Api } from '../../models/utils';
import { ENCRYPTED_STATUS } from '../../constants';
import { listInlineAttachments, getAttachment } from './embeddedFinder';
import { hasBlob, store, getBlob, BlobInfo } from './embeddedStoreBlobs';
import { get } from '../attachment/attachmentLoader';
import { Attachment } from '../../models/attachment';
import { noop } from 'proton-shared/lib/helpers/function';
import { wait } from 'proton-shared/lib/helpers/promise';
import { getMessageCIDs } from './embeddedStoreCids';
import { findEmbedded, srcToCID } from './embeddedUtils';
import { isInlineEmbedded, isEmbedded } from '../image';
import { AttachmentsCache } from '../../hooks/useAttachments';

const EMBEDDED_CLASSNAME = 'proton-embedded';

const wrapImage = (img: Element) => wrap(img, '<div class="image loading"></div>');

/**
 * Get the url for an embedded image
 */
export const getUrl = (node: Element) => {
    // If it's an inline embedded img, just return the src because that contains the img data.
    const src = node.getAttribute('data-embedded-img') || '';
    if (isInlineEmbedded(src)) {
        return src;
    }
    const cid = srcToCID(node);
    const { url = '' } = getBlob(cid);
    return url;
};

/**
 * Prepare embedded images in the document
 */
export const prepareImages = (message: MessageExtended, show: boolean, isReplyForward: boolean, isOutside: boolean) => {
    if (!message.document) {
        return;
    }

    let showEmbedded = message.showEmbeddedImages;

    const images = [...message.document.querySelectorAll('img[proton-src]')];

    images.forEach((image) => {
        const src = image.getAttribute('proton-src') || undefined;
        image.setAttribute('referrerPolicy', 'no-referrer');
        const attachment = getAttachment(message.data, src);

        if (!image.classList.contains(EMBEDDED_CLASSNAME)) {
            image.classList.add(EMBEDDED_CLASSNAME);
        }

        if (!image.parentElement) {
            return;
        }

        // check if the attachment exist before processing
        if (!(attachment && Object.keys(attachment).length > 0)) {
            /**
             * If the attachment does not exist and the proton-src attribute
             * starts with cid:, it's an embedded image that does not exist in the list of attachments,
             * or is not a valid image.
             * So remove the element from the DOM because it will not display anything useful anyway.
             */
            if (isEmbedded(src)) {
                image.parentElement.removeChild(image);
            }
            // If it's not an inline embedded image, it's either an embedded image or a remote image. So stop here.
            // Otherwise, continue so that the inline image is detected as an embedded image.
            if (!isInlineEmbedded(src)) {
                return;
            }
        }

        if (show) {
            image.setAttribute('data-embedded-img', src || '');
            /**
             * Since the image is supposed to be displayed, remove the proton-src attribute.
             * Then it will be parsed by the embeddedParser in the blob or cid direction.
             */
            image.removeAttribute('proton-src');

            // Auto load image inside a reply draft
            if (isReplyForward) {
                // `getUrl` may return undefined here because the embedded attachments have not yet been decrypted and put in the blob store.
                const url = getUrl(image);
                // only set it if it is defined, otherwise the unescapeSrc will add two src=""
                url && image.setAttribute('src', url);
                return;
            }

            // We don't need to add it outside
            if (!isOutside) {
                !image.parentElement.classList.contains('loading') && wrapImage(image);
                image.removeAttribute('src');
            }
            return;
        }

        showEmbedded = false;

        // Inline embedded images does not have an attachment.
        if (attachment) {
            image.setAttribute('alt', attachment.Name || '');
        }
    });

    return showEmbedded;
};

/**
 * launch and forget: we don't need to do anything with the result
 * wait a bit before disabling the invalidsignature modal
 * this allows the user to see the change icon popup.
 *
 * More elaborate explanation:
 * We're addressing a fairly rare UX thing here.
 * We want to avoid showing a popup saying the confirmmodal when the signature is invalid to often.
 * For instance, when embedding images you can see that the icon says the signature is invalid,
 * so we don't show this icon (as the user can know it before clicking).
 *
 * However, if you would click on the embedded attachment before it has downloaded the attachment, it will not show this icon.
 * So consider you clicking on this attachment when it didn't verify the attachment yet.
 * Then just after that the attachment loader downloaded the attachment and
 * verified it signature and sets invalidSignature.askAgain to false.
 * Then you don't know that this happened, but in this case you should get a popup.
 *
 * Note when thinking  this is just a race condition: also consider the case where you are clicking
 * on the icon and it shows the icon just before you click: it's not humanly possible to see that it
 * changed and is not valid. So even in that case we want to show the icon.
 */
const triggerSigVerification = (
    message: MessageExtended,
    attachments: Attachment[],
    api: Api,
    cache: Map<string, any>
) => {
    /*
     * launch and forget: we don't need to do anything with the result
     * wait a bit before disabling the invalidsignature modal
     * this allows the user to see the change icon popup.
     */
    Promise.all(
        attachments.map(async (attachment) => {
            await get(attachment, message, cache, api);
            await wait(1000);
            // invalidSignature.askAgain(message, attachment, false);
        })
    );
};

/**
 * It works on data-src attribute for this reason:
 * Don't set the src attribute since it's evaluated and cid:cid create an error (#3330)
 * NET::ERR_UNKNOWN_URL_SCHEME because src="cid:xxxx" is not valid HTML
 * This function expects the content to be properly unescaped later.
 */
const actionDirection: { [key: string]: (nodes: Element[], cid: string, url: string) => void } = {
    blob(nodes: Element[], cid: string, url: string) {
        nodes.forEach((node) => {
            // Always remove the `data-` src attribute set by the cid function, otherwise it can get displayed if the user does not auto load embedded images.
            node.removeAttribute('data-src');
            if (node.getAttribute('proton-src')) {
                return;
            }
            node.setAttribute('data-src', url);
            node.setAttribute('data-embedded-img', cid);
            node.classList.add(EMBEDDED_CLASSNAME);
        });
    },
    cid(nodes: Element[], cid: string) {
        nodes.forEach((node) => {
            node.removeAttribute('data-embedded-img');
            node.removeAttribute('src');
            node.setAttribute('data-src', `cid:${cid}`);
        });
    }
};

/**
 * Parse the content to inject the generated blob src
 */
export const mutateHTML = (message: MessageExtended, direction: string) => {
    if (!message.document) {
        return;
    }

    const document = message.document;

    document.innerHTML = escapeSrc(document.innerHTML);

    Object.keys(getMessageCIDs(message.data)).forEach((cid) => {
        const nodes = findEmbedded(cid, document);

        if (nodes.length) {
            const { url = '' } = getBlob(cid);

            (actionDirection[direction] || noop)(nodes, cid, url);
        }
    });

    document.innerHTML = unescapeSrc(document.innerHTML);
};

export const decrypt = async (message: MessageExtended, api: Api, cache: AttachmentsCache) => {
    const list = listInlineAttachments(message);
    const attachments = list.map(({ attachment }) => attachment);
    // const show = message.showEmbeddedImages === true || mailSettings.ShowImages & SHOW_IMAGES.EMBEDDED;
    // const sigList = show ? list : list.filter(({ attachment }) => cache.has(attachment.ID));

    // For a draft if we close it before the end of the attachment upload, there are no keyPackets
    // pgp attachments do not have keypackets.

    const promises = list
        .filter(({ attachment }) => attachment.KeyPackets || attachment.Encrypted === ENCRYPTED_STATUS.PGP_MIME)
        .filter(({ cid }) => !hasBlob(cid))
        .map(async ({ cid, attachment }) => {
            const storeAttachement = store(message.data, cid);
            const buffer = await get(attachment, message, cache, api);
            return storeAttachement(buffer.data, attachment.MIMEType);
        });

    if (!promises.length) {
        // all cid was already stored, we can resolve
        triggerSigVerification(message, attachments, api, cache);
        return {};
    }

    await Promise.all(promises);

    // We need to trigger on the original list not after filtering: after filter they are just stored
    // somewhere else
    triggerSigVerification(message, attachments, api, cache);
    return list.reduce((acc, { cid }) => {
        acc[cid] = getBlob(cid);
        return acc;
    }, {} as { [cid: string]: BlobInfo });
};

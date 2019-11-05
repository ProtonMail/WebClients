import { flow, filter, map } from 'lodash/fp';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { wait } from 'proton-shared/lib/helpers/promise';
import { noop } from 'proton-shared/lib/helpers/function';

import { parseInDiv } from '../../helpers/domHelper';
import * as embeddedUtils from './embeddedUtils';
import * as embeddedStore from './embeddedStore';
import * as embeddedFinder from './embeddedFinder';

const ENCRYPTED_STATUS = {
    PGP_MIME: 8 // Used for attachment
};

const EMBEDDED_CLASSNAME = 'proton-embedded';

// TODO: Remove these mocks
const AttachmentLoader = { get: noop, has: noop };
const invalidSignature = { confirm: noop, askAgain: noop };

/**
 * It works on data-src attribute for this reason:
 * Don't set the src attribute since it's evaluated and cid:cid create an error (#3330)
 * NET::ERR_UNKNOWN_URL_SCHEME because src="cid:xxxx" is not valid HTML
 * This function expects the content to be properly unescaped later.
 */
const actionDirection = {
    blob(nodes, cid, url) {
        [...nodes].forEach((node) => {
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
    cid(nodes, cid) {
        [...nodes].forEach((node) => {
            node.removeAttribute('data-embedded-img');
            node.removeAttribute('src');
            node.setAttribute('data-src', `cid:${cid}`);
        });
    }
};

/**
 * Parse the content to inject the generated blob src
 * This function expects the content to be unescaped later.
 * @param  {Resource} message             Message
 * @param  {String} direction             Parsing to execute, blob || cid
 * @param  {Node} testDiv
 * @return {String}                       Parsed HTML
 */
export const mutateHTML = (message, direction, testDiv) => {
    Object.keys(embeddedStore.cid.get(message)).forEach((cid) => {
        const nodes = embeddedUtils.findEmbedded(cid, testDiv);

        if (nodes.length) {
            const { url = '' } = embeddedStore.getBlob(cid);

            (actionDirection[direction] || noop)(nodes, cid, url);
        }
    });
};

export const removeEmbeddedHTML = (message, Headers = {}, content = '') => {
    const cid = embeddedUtils.readCID(Headers);
    const tempDOM = parseInDiv(content);
    const nodes = tempDOM.find(
        `img[src="cid:${cid}"], img[data-embedded-img="cid:${cid}"], img[data-embedded-img="${cid}"]`
    );
    if (nodes.length) {
        nodes.remove();
    }
    return tempDOM.html();
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
 * @param {Object} message
 * @param {Array} list (list of attachments)
 */
const triggerSigVerification = (message, list) => {
    /*
     * launch and forget: we don't need to do anything with the result
     * wait a bit before disabling the invalidsignature modal
     * this allows the user to see the change icon popup.
     */
    Promise.all(
        list.map(({ attachment }) =>
            AttachmentLoader.get(attachment, message)
                .then(() => wait(1000))
                .then(() => invalidSignature.askAgain(message, attachment, false))
        )
    );
};

export const decrypt = (message, mailSettings) => {
    const list = embeddedFinder.listInlineAttachments(message);
    const show = message.showEmbedded === true || mailSettings.ShowImages & SHOW_IMAGES.EMBEDDED;
    const sigList = show ? list : list.filter(({ attachment }) => AttachmentLoader.has(attachment));

    // For a draft if we close it before the end of the attachment upload, there are no keyPackets
    const promise = flow(
        // pgp attachments do not have keypackets.
        filter(({ attachment }) => attachment.KeyPackets || attachment.Encrypted === ENCRYPTED_STATUS.PGP_MIME),
        filter(({ cid }) => !embeddedStore.hasBlob(cid) && show),
        map(({ cid, attachment }) => {
            const storeAttachement = embeddedStore.store(message, cid);
            return AttachmentLoader.get(attachment, message).then((buffer) =>
                storeAttachement(buffer, attachment.MIMEType)
            );
        })
    )(list);

    if (!promise.length) {
        // all cid was already stored, we can resolve
        triggerSigVerification(message, sigList);
        return Promise.resolve({});
    }

    return Promise.all(promise).then(() => {
        // We need to trigger on the original list not after filtering: after filter they are just stored
        // somewhere else
        triggerSigVerification(message, sigList);
        return list.reduce((acc, { cid }) => {
            acc[cid] = embeddedStore.getBlob(cid);
            return acc;
        }, Object.create(null));
    });
};

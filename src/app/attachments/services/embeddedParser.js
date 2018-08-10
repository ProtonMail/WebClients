import _ from 'lodash';
import { flow, filter, map } from 'lodash/fp';

import { EMBEDDED, ENCRYPTED_STATUS } from '../../constants';

/* @ngInject */
function embeddedParser(
    embeddedStore,
    embeddedFinder,
    embeddedUtils,
    AttachmentLoader,
    attachmentFileFormat,
    $state,
    invalidSignature,
    $timeout,
    mailSettingsModel
) {
    const EMBEDDED_CLASSNAME = 'proton-embedded';

    const actionDirection = {
        blob(nodes, cid, url) {
            _.each(nodes, (node) => {
                node.src = url;
                node.setAttribute('data-embedded-img', cid);
                node.removeAttribute('data-src');
                node.classList.add(EMBEDDED_CLASSNAME);
            });
        },
        cid(nodes, cid) {
            /**
             * Don't set the src attribute since it's evaluated and cid:cid create an error (#3330)
             * NET::ERR_UNKNOWN_URL_SCHEME because src="cid:xxxx" is not valid HTML
             */
            _.each(nodes, (node) => {
                node.removeAttribute('data-embedded-img');
                node.removeAttribute('src');

                // Used later with a regexp
                node.setAttribute('data-src', `cid:${cid}`);
            });
        }
    };

    /**
     * Parse the content to inject the generated blob src
     * @param  {Resource} message             Message
     * @param  {String} direction             Parsing to execute, blob || cid
     * @return {String}                       Parsed HTML
     */
    const escapeHTML = (message, direction, body) => {
        const testDiv = embeddedUtils.getBodyParser(body);

        Object.keys(embeddedStore.cid.get(message)).forEach((cid) => {
            const nodes = embeddedUtils.findEmbedded(cid, testDiv);

            if (nodes.length) {
                const { url = '' } = embeddedStore.getBlob(cid);

                (actionDirection[direction] || angular.noop)(nodes, cid, url);
            }
        });

        /**
         * Prevent this error (#3330):
         * NET::ERR_UNKNOWN_URL_SCHEME because src="cid:xxxx" is not valid HTML
         */
        return testDiv.innerHTML.replace(/data-src/g, 'src');
    };

    const removeEmbeddedHTML = (message, Headers = {}, content = '') => {
        if (embeddedUtils.isInline(Headers)) {
            const cid = embeddedUtils.readCID(Headers);

            const tempDOM = $(`<div>${content || message.getDecryptedBody()}</div>`);
            message.NumEmbedded--;
            const nodes = tempDOM.find(
                `img[src="cid:${cid}"], img[data-embedded-img="cid:${cid}"], img[data-embedded-img="${cid}"]`
            );
            nodes.length && nodes.remove();
            message.setDecryptedBody(tempDOM.html(), true);
        }

        return message.getDecryptedBody();
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
            _.map(list, ({ attachment }) =>
                AttachmentLoader.get(attachment, message)
                    .then(() => $timeout(angular.noop, 1000, false))
                    .then(() => invalidSignature.askAgain(message, attachment, false))
            )
        );
    };

    const decrypt = (message) => {
        const list = embeddedFinder.listInlineAttachments(message);
        const show = message.showEmbedded === true || mailSettingsModel.get('ShowImages') & EMBEDDED;
        const sigList = show ? list : _.filter(list, ({ attachment }) => AttachmentLoader.has(attachment));

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

    return { escapeHTML, removeEmbeddedHTML, decrypt };
}
export default embeddedParser;

import _ from 'lodash';
import { flow, filter, map } from 'lodash/fp';
import { EMBEDDED } from '../../constants';

/* @ngInject */
function embeddedParser(embeddedStore, embeddedFinder, embeddedUtils, AttachmentLoader, attachmentFileFormat, $state, mailSettingsModel) {
    const DIV = document.createElement('DIV');
    const EMBEDDED_CLASSNAME = 'proton-embedded';

    /**
     * Flush the container HTML and return the container
     * @return {Node} Empty DIV
     */
    const getBodyParser = () => ((DIV.innerHTML = ''), DIV);

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
        const testDiv = getBodyParser();

        // Escape  cid-errors
        testDiv.innerHTML = body.replace(/src="cid/g, 'data-src="cid');

        Object.keys(embeddedStore.cid.get(message)).forEach((cid) => {
            const current = embeddedStore.getBlob(cid);
            const url = current ? current.url : '';
            const selector = `img[src="${cid}"], img[data-embedded-img="cid:${cid}"], img[data-embedded-img="${cid}"], img[data-src="cid:${cid}"]`;
            const nodes = [].slice.call(testDiv.querySelectorAll(selector));

            if (nodes.length) {
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
            const nodes = tempDOM.find(`img[src="cid:${cid}"], img[data-embedded-img="cid:${cid}"], img[data-embedded-img="${cid}"]`);
            nodes.length && nodes.remove();
            message.setDecryptedBody(tempDOM.html(), true);
        }

        return message.getDecryptedBody();
    };

    const decrypt = (message) => {
        const list = embeddedFinder.listInlineAttachments(message);
        const show = message.showEmbedded === true || mailSettingsModel.get('ShowImages') & EMBEDDED;
        const isDraft = $state.includes('secured.drafts.**') || message.isDraft();

        // For a draft if we close it before the end of the attachment upload, there are no keyPackets
        const promise = flow(
            filter(({ attachment }) => attachment.KeyPackets),
            filter(({ cid }) => !embeddedStore.hasBlob(cid) && (show || isDraft)),
            map(({ cid, attachment }) => {
                const storeAttachement = embeddedStore.store(message, cid);
                return AttachmentLoader.get(attachment, message).then((buffer) => storeAttachement(buffer, attachment.MIMEType));
            })
        )(list);

        if (!promise.length) {
            // all cid was already stored, we can resolve
            return Promise.resolve({});
        }

        return Promise.all(promise).then(() => {
            return list.reduce((acc, { cid }) => {
                acc[cid] = embeddedStore.getBlob(cid);
                return acc;
            }, Object.create(null));
        });
    };

    return { escapeHTML, removeEmbeddedHTML, decrypt };
}
export default embeddedParser;

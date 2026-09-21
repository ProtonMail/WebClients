import {
    locateBlockquote,
    removeSignatureFromHTMLMessage,
} from '@proton/mail-message/helpers/message/messageBlockquote';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

/** Whether an exported EO reply carries the quoted original and nothing the recipient wrote.
 *
 *  This is the shape users reported when the composer failed to hand its content to the
 *  message model. A plain emptiness check does not catch it: a reply draft always contains
 *  the blockquote and the signature block, so the export is never empty even when the typed
 *  text is missing. Text or an inline image before the blockquote both count as content.
 *
 *  `locateBlockquote` mutates the element it is given, hence the detached copy.
 */
export const hasNothingBeforeBlockquote = (replyContent: string) => {
    const [contentBeforeBlockquote] = locateBlockquote(parseStringToDOM(replyContent).body);
    const withoutSignature = parseStringToDOM(removeSignatureFromHTMLMessage(contentBeforeBlockquote)).body;

    return (withoutSignature.textContent ?? '').trim() === '' && !withoutSignature.querySelector('img');
};

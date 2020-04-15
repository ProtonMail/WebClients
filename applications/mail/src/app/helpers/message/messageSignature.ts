import { MailSettings } from 'proton-shared/lib/interfaces';
import { PM_SIGNATURE } from 'proton-shared/lib/constants';
import { MESSAGE_ACTIONS } from '../../constants';

import { dedentTpl } from '../dedent';
import { replaceLineBreaks } from '../string';
import { message } from '../purify';
import { parseInDiv, isHTMLEmpty } from '../dom';

export const CLASSNAME_SIGNATURE_CONTAINER = 'protonmail_signature_block';
export const CLASSNAME_SIGNATURE_USER = 'protonmail_signature_block-user';
export const CLASSNAME_SIGNATURE_PROTON = 'protonmail_signature_block-proton';
export const CLASSNAME_SIGNATURE_EMPTY = 'protonmail_signature_block-empty';

/**
 * Preformat the protonMail signature
 */
const getProtonSignature = (mailSettings: MailSettings) => (mailSettings.PMSignature === 0 ? '' : PM_SIGNATURE);

/**
 * Generate a space tag, it can be hidden from the UX via a className
 */
const createSpace = (className = '') => {
    const tagOpen = className ? `<div class="${className}">` : '<div>';
    return `${tagOpen}<br /></div>`;
};

/**
 * Generate spaces for the signature
 *     No signature: 1 space
 *     addressSignature: 2 spaces + addressSignature
 *     protonSignature: 2 spaces + protonSignature
 *     user + proton signature: 2 spaces + addressSignature + 1 space + protonSignature
 */
const getSpaces = (signature: string, protonSignature: string, isReply = false) => {
    const isUserEmpty = isHTMLEmpty(signature);
    const isEmptySignature = isUserEmpty && !protonSignature;
    return {
        start: isEmptySignature ? createSpace() : createSpace() + createSpace(),
        end: isReply ? createSpace() : '',
        between: !isUserEmpty && protonSignature ? createSpace() : ''
    };
};

/**
 * Generate a map of classNames used for the signature template
 */
const getClassNamesSignature = (signature: string, protonSignature: string) => {
    const isUserEmpty = isHTMLEmpty(signature);
    const isProtonEmpty = !protonSignature;
    return {
        userClass: isUserEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
        protonClass: isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
        containerClass: isUserEmpty && isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : ''
    };
};

/**
 * Generate the template for a signature and clean it
 */
export const templateBuilder = (signature = '', mailSettings: MailSettings, isReply = false, noSpace = false) => {
    const protonSignature = getProtonSignature(mailSettings);
    const { userClass, protonClass, containerClass } = getClassNamesSignature(signature, protonSignature);
    const space = getSpaces(signature, protonSignature, isReply);

    const template = dedentTpl`
        <div class="${CLASSNAME_SIGNATURE_CONTAINER} ${containerClass}">
            <div class="${CLASSNAME_SIGNATURE_USER} ${userClass}">
                ${replaceLineBreaks(signature)}
            </div>
            ${space.between}
            <div class="${CLASSNAME_SIGNATURE_PROTON} ${protonClass}">
                ${replaceLineBreaks(protonSignature)}
            </div>
        </div>
    `;

    if (!noSpace) {
        return `${space.start}${message(template)}${space.end}`;
    }

    return message(template);
};

/**
 * Insert Signatures before the message
 *     - Always append a container signature with both user's and proton's
 *     - Theses signature can be empty but the dom remains
 */
export const insertSignature = (
    content = '',
    signature = '',
    action: MESSAGE_ACTIONS,
    mailSettings: MailSettings,
    isAfter = false
) => {
    const position = isAfter ? 'beforeend' : 'afterbegin';
    const template = templateBuilder(signature, mailSettings, action !== MESSAGE_ACTIONS.NEW);

    // Parse the current message and append before it the signature
    const element = parseInDiv(content);
    element.insertAdjacentHTML(position, template);

    return element.innerHTML;
};

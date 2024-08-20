import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';
import { message } from '@proton/shared/lib/sanitize';
import isTruthy from '@proton/utils/isTruthy';

import { MESSAGE_ACTIONS } from '../../constants';
import type { MessageState } from '../../store/messages/messagesTypes';
import { dedentTpl } from '../dedent';
import { isHTMLEmpty } from '../dom';
import { containsHTMLTag, replaceLineBreaks } from '../string';
import { exportPlainText, getPlainTextContent } from './messageContent';
import { CLASSNAME_BLOCKQUOTE } from './messageDraft';

export const CLASSNAME_SIGNATURE_CONTAINER = 'protonmail_signature_block';
export const CLASSNAME_SIGNATURE_USER = 'protonmail_signature_block-user';
export const CLASSNAME_SIGNATURE_PROTON = 'protonmail_signature_block-proton';
export const CLASSNAME_SIGNATURE_EMPTY = 'protonmail_signature_block-empty';

/**
 * Preformat the protonMail signature
 */
const getProtonSignature = (mailSettings: Partial<MailSettings> = {}, userSettings: Partial<UserSettings> = {}) =>
    mailSettings.PMSignature === PM_SIGNATURE.DISABLED
        ? ''
        : getProtonMailSignature({
              isReferralProgramLinkEnabled: !!mailSettings.PMSignatureReferralLink,
              referralProgramUserLink: userSettings.Referral?.Link,
          });

/**
 * Generate a space tag, it can be hidden from the UX via a className
 */
const createSpace = (style?: string, className?: string) => {
    const tagOpen = [
        'div',
        style === undefined ? undefined : `style="${style}"`,
        className === undefined ? undefined : `class="${className}"`,
    ]
        .filter(isTruthy)
        .join(' ');
    return `<${tagOpen}><br /></div>`;
};

/**
 * Generate spaces for the signature
 *     No signature: 1 space
 *     addressSignature: 2 spaces + addressSignature
 *     protonSignature: 2 spaces + protonSignature
 *     user + proton signature: 2 spaces + addressSignature + 1 space + protonSignature
 */
const getSpaces = (signature: string, protonSignature: string, fontStyle: string | undefined, isReply = false) => {
    const isUserSignatureEmpty = isHTMLEmpty(signature);
    const isEmptySignature = isUserSignatureEmpty && !protonSignature;
    return {
        start: isEmptySignature ? createSpace(fontStyle) : createSpace(fontStyle) + createSpace(fontStyle),
        end: isReply ? createSpace(fontStyle) : '',
        between: !isUserSignatureEmpty && protonSignature ? createSpace(fontStyle) : '',
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
        containerClass: isUserEmpty && isProtonEmpty ? CLASSNAME_SIGNATURE_EMPTY : '',
    };
};

/**
 * Generate the template for a signature and clean it
 */
export const templateBuilder = (
    signature = '',
    mailSettings: Partial<MailSettings> | undefined = {},
    userSettings: Partial<UserSettings> | undefined = {},
    fontStyle: string | undefined,
    isReply = false,
    noSpace = false
) => {
    const protonSignature = getProtonSignature(mailSettings, userSettings);
    const { userClass, protonClass, containerClass } = getClassNamesSignature(signature, protonSignature);
    const space = getSpaces(signature, protonSignature, fontStyle, isReply);

    const formattedSignature: string = (() => {
        const isEmptyContent = isHTMLEmpty(signature);
        if (isEmptyContent) {
            return '';
        }

        const signatureContainsHTML = containsHTMLTag(signature);

        if (signatureContainsHTML) {
            return signature;
        }

        return replaceLineBreaks(signature);
    })();

    const defaultStyle = fontStyle === undefined ? '' : `style="${fontStyle}" `;
    const template = dedentTpl`
        <div ${defaultStyle}class="${CLASSNAME_SIGNATURE_CONTAINER} ${containerClass}">
            <div class="${CLASSNAME_SIGNATURE_USER} ${userClass}">
                ${formattedSignature}
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
    userSettings: Partial<UserSettings>,
    fontStyle: string | undefined,
    isAfter = false
) => {
    const position = isAfter ? 'beforeend' : 'afterbegin';
    const template = templateBuilder(signature, mailSettings, userSettings, fontStyle, action !== MESSAGE_ACTIONS.NEW);

    // Parse the current message and append before it the signature
    const element = parseStringToDOM(content);
    element.body.insertAdjacentHTML(position, template);

    return element.body.innerHTML;
};

/**
 * Return the content of the message with the signature switched from the old one to the new one
 */
export const changeSignature = (
    message: MessageState,
    mailSettings: Partial<MailSettings> | undefined,
    userSettings: Partial<UserSettings> | undefined,
    fontStyle: string | undefined,
    oldSignature: string,
    newSignature: string
) => {
    if (isPlainText(message.data)) {
        const oldTemplate = templateBuilder(oldSignature, mailSettings, userSettings, fontStyle, false, true);
        const newTemplate = templateBuilder(newSignature, mailSettings, userSettings, fontStyle, false, true);
        const content = getPlainTextContent(message);
        const oldSignatureText = exportPlainText(oldTemplate).trim();
        const newSignatureText = exportPlainText(newTemplate).trim();

        // Special case when there was no signature before
        if (oldSignatureText === '') {
            return `${content}\n\n${newSignatureText}`;
        }

        return (
            content
                .replace(oldSignatureText, newSignatureText)
                // Remove empty lines at the end, remove all lines if no signatures
                .trimEnd()
        );
    }
    const document = message.messageDocument?.document as Element;

    const userSignature = [...document.querySelectorAll(`.${CLASSNAME_SIGNATURE_USER}`)].find(
        (element) => element.closest(`.${CLASSNAME_BLOCKQUOTE}`) === null
    );

    if (userSignature) {
        const protonSignature = getProtonSignature(mailSettings, userSettings);
        const { userClass, containerClass } = getClassNamesSignature(newSignature, protonSignature);

        userSignature.innerHTML = replaceLineBreaks(newSignature);
        userSignature.className = `${CLASSNAME_SIGNATURE_USER} ${userClass}`;

        const signatureContainer = userSignature?.closest(`.${CLASSNAME_SIGNATURE_CONTAINER}`);
        if (signatureContainer && signatureContainer !== null) {
            signatureContainer.className = `${CLASSNAME_SIGNATURE_CONTAINER} ${containerClass}`;
        }
    }

    return document.innerHTML;
};

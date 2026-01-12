import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { Address } from '@proton/shared/lib/interfaces';
import { FORWARDED_MESSAGE, ORIGINAL_MESSAGE } from '@proton/shared/lib/mail/messages';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';

import { exportPlainText } from './messageContent';

export const BLOCKQUOTE_SELECTORS = [
    '.protonmail_quote', // Proton Mail
    // Gmail creates both div.gmail_quote and blockquote.gmail_quote. The div
    // version marks text but does not cause indentation, but both should be
    // considered quoted text.
    '.gmail_quote', // Gmail
    'div.gmail_extra', // Gmail
    'div.yahoo_quoted', // Yahoo Mail
    'blockquote.iosymail', // Yahoo iOS Mail
    '.tutanota_quote', // Tutanota Mail
    '.zmail_extra', // Zoho
    '.skiff_quote', // Skiff Mail
    'blockquote[data-skiff-mail]', // Skiff Mail
    '#divRplyFwdMsg', // Outlook Mail
    'div[id="mail-editor-reference-message-container"]', // Outlook
    'div[id="3D\\"divRplyFwdMsg\\""]', // Office365
    'hr[id=replySplit]',
    '.moz-cite-prefix',
    'div[id=isForwardContent]',
    'blockquote[id=isReplyContent]',
    'div[id=mailcontent]',
    'div[id=origbody]',
    'div[id=reply139content]',
    'blockquote[id=oriMsgHtmlSeperator]',
    'blockquote[type="cite"]',
    '[name="quote"]', // gmx
];

const BLOCKQUOTE_TEXT_SELECTORS = [ORIGINAL_MESSAGE];

const BLOCKQUOTE_SELECTOR = BLOCKQUOTE_SELECTORS.map((selector) => `${selector}:not(:empty)`).join(',');

// When we try to determine what part of the body is the blockquote,
// We want to check that there is no text or no "important" element after the element we're testing
const ELEMENTS_AFTER_BLOCKQUOTES = [
    '.proton-image-anchor', // At this point we already replaced images with an anchor, but we want to keep them
];

/**
 * Returns content before and after match in the source
 * Beware, String.prototype.split does almost the same but will not if there is several match
 */
export const split = (source: string, match: string): [string, string] => {
    const index = source.indexOf(match);
    if (index === -1) {
        return [source, ''];
    }
    return [source.slice(0, index), source.slice(index + match.length)];
};

const searchForContent = (element: Element, text: string) => {
    const xpathResult = element.ownerDocument?.evaluate(
        `//*[text()='${text}']`,
        element,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
    );
    const result: Element[] = [];
    let match = null;

    while ((match = xpathResult?.iterateNext())) {
        result.push(match as Element);
    }
    return result;
};

const MICROSOFT_WORD_SEPARATOR_PATTERNS = ['border-top:solid #E1E1E1 1', 'border-top:solid #B5C4DF 1'] as const;

const REQUIRED_WORD_SEPARATOR_STYLES = ['border:none', 'padding:3'] as const;

const hasMicrosoftWordSeparatorStyle = (element: Element): boolean => {
    const style = element.getAttribute('style') ?? '';

    const hasRequiredStyles = REQUIRED_WORD_SEPARATOR_STYLES.every((requiredStyle) => style.includes(requiredStyle));

    const hasSeparatorPattern = MICROSOFT_WORD_SEPARATOR_PATTERNS.some((pattern) => style.includes(pattern));

    return hasRequiredStyles && hasSeparatorPattern;
};

const collectSiblingNodesAfter = (startNode: Node): Node[] => {
    const nodes: Node[] = [startNode];
    let currentNode = startNode.nextSibling;

    while (currentNode) {
        const nextSibling = currentNode.nextSibling;
        nodes.push(currentNode);
        currentNode = nextSibling;
    }

    return nodes;
};

const moveNodesToBlockquote = (nodes: Node[], blockquote: Element): void => {
    nodes.forEach((node) => {
        node.parentNode?.removeChild(node);
        blockquote.appendChild(node);
    });
};

const processMicrosoftWordEmail = (inputDocument: Element): Element => {
    const wordSection = inputDocument.querySelector('div.WordSection1');

    if (!wordSection) {
        return inputDocument;
    }

    const existingSeparator = inputDocument.querySelector(BLOCKQUOTE_SELECTOR);
    if (existingSeparator) {
        return inputDocument;
    }

    const separatorDiv = Array.from(wordSection.querySelectorAll('div')).find(hasMicrosoftWordSeparatorStyle);

    if (!separatorDiv) {
        return inputDocument;
    }

    const blockquote = inputDocument.ownerDocument?.createElement('blockquote');
    if (!blockquote) {
        return inputDocument;
    }

    blockquote.setAttribute('type', 'cite');

    const elementsToMove = collectSiblingNodesAfter(separatorDiv);
    moveNodesToBlockquote(elementsToMove, blockquote);

    wordSection.appendChild(blockquote);

    return inputDocument;
};

/**
 * Try to locate the eventual blockquote present in the document no matter the expeditor of the mail
 * Return the HTML content split at the blockquote start
 */
export const locateBlockquote = (inputDocument: Element | undefined): [content: string, blockquote: string] => {
    if (!inputDocument) {
        return ['', ''];
    }

    // Process Microsoft Word emails first to transform them into standard blockquote structure
    const processedDocument = processMicrosoftWordEmail(inputDocument);
    const body = processedDocument.querySelector('body');
    const tmpDocument = body || processedDocument;

    const parentHTML = tmpDocument.innerHTML || '';
    let result: [string, string] | null = null;

    const testBlockquote = (blockquote: Element) => {
        const blockquoteHTML = blockquote.outerHTML || '';
        const [beforeHTML = '', afterHTML = ''] = split(parentHTML, blockquoteHTML);

        const after = parseStringToDOM(afterHTML);

        // The "real" blockquote will be determined based on the fact:
        // - That there is no text after the current blockquote element
        // - That there is no "important" element after the current blockquote element
        const hasImageAfter = after.body.querySelector(ELEMENTS_AFTER_BLOCKQUOTES.join(','));
        const hasTextAfter = after.body?.textContent?.trim().length;

        if (!hasImageAfter && !hasTextAfter) {
            return [beforeHTML, blockquoteHTML] as [string, string];
        }

        return null;
    };

    // Standard search with a composed query selector
    const blockquotes = [...tmpDocument.querySelectorAll(BLOCKQUOTE_SELECTOR)];
    blockquotes.forEach((blockquote) => {
        if (result === null) {
            result = testBlockquote(blockquote);
        }
    });

    // Second search based on text content with xpath
    if (result === null) {
        BLOCKQUOTE_TEXT_SELECTORS.forEach((text) => {
            if (result === null) {
                searchForContent(tmpDocument, text).forEach((blockquote) => {
                    if (result === null) {
                        result = testBlockquote(blockquote);
                    }
                });
            }
        });
        // document.ownerDocument?.evaluate;
    }

    return result || [parentHTML, ''];
};

export const removeSignatureFromHTMLMessage = (contentBeforeBlockquote: string): string => {
    const contentDocument = parseStringToDOM(contentBeforeBlockquote);
    contentDocument.body.querySelector('.protonmail_signature_block')?.remove();
    return contentDocument.body.outerHTML;
};

/**
 * Try to locate blockquotes on a plaintext message. This will only work for internal messages.
 *
 * The detection handle two cases, forward and reply.
 * FORWARD CASE
 * - look for the following string: ------- Forwarded Message -------
 *
 * REPLY CASE
 * - start by checking of the contents contains one line finishing with a colon and includes an email address and a chevron (cheap)
 * - look for the following string: On Tuesday, 24 september 2024 at 4:00 PM, Sender <sender@address> wrote: (expensive)
 *
 */
export const locatePlaintextInternalBlockquotes = (content?: string) => {
    // If there is no content at all, return an empty tuple
    if (!content) {
        return ['', ''];
    }

    // FORWARD CASE
    const forwardMatch = content.indexOf(FORWARDED_MESSAGE);
    if (forwardMatch !== -1) {
        return [content.slice(0, forwardMatch), content.slice(forwardMatch)];
    }

    // REPLY CASE
    // Cheap test to check if the content contains a line ending with a colon and
    // includes an email address and a chevron
    const lineEndsWithColon = content
        .split('\n')
        .some((line) => line.endsWith(':') && line.includes('<') && line.includes('>'));
    if (!lineEndsWithColon) {
        return [content, ''];
    }

    // Expensive text, looking for a line containing an email, some backspace and a chevron
    const emailRegex = '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+';
    const replyRegex = new RegExp(`^[^\\n]*<${emailRegex}>[^\\n]*:\\s*\\n\\s*\\n>`, 'm');
    const replyMatchIndex = content.search(replyRegex);
    if (replyMatchIndex !== -1) {
        return [content.slice(0, replyMatchIndex), content.slice(replyMatchIndex)];
    }

    return [content, ''];
};

export const removeSignatureFromPlainTextMessage = (
    contentBeforeBlockquote: string,
    addressID: string,
    addresses: Address[] | undefined
): string => {
    const address = addresses?.find((a) => a.ID === addressID);
    const addressSignature = exportPlainText(address?.Signature ?? '');
    const protonSignaturePlainText = exportPlainText(getProtonMailSignature());

    const signatureIndex = addressSignature === '' ? -1 : contentBeforeBlockquote.lastIndexOf(addressSignature);

    if (signatureIndex === -1) {
        return contentBeforeBlockquote;
    }

    const beforeSignature = contentBeforeBlockquote.slice(0, signatureIndex);
    const afterSignature = contentBeforeBlockquote.slice(signatureIndex + addressSignature.length);

    const isAtEnd = afterSignature.trim() === '';
    const isOnlyProtonSignature = afterSignature.trim() === protonSignaturePlainText;
    const hasNewlinesBefore = /\n\s*\n\s*$/.test(beforeSignature);

    if ((isAtEnd || isOnlyProtonSignature) && hasNewlinesBefore) {
        return contentBeforeBlockquote.slice(0, signatureIndex);
    }

    return contentBeforeBlockquote;
};

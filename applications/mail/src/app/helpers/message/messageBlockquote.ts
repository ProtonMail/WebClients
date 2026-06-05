import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { Address } from '@proton/shared/lib/interfaces';
import { FORWARDED_MESSAGE, ORIGINAL_MESSAGE } from '@proton/shared/lib/mail/messages';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';

import { exportPlainTextSignature } from './messageSignature';

export const BLOCKQUOTE_SELECTORS = [
    '.protonmail_quote', // Proton Mail
    // Gmail creates both div.gmail_quote and blockquote.gmail_quote. The div
    // version marks text but does not cause indentation, but both should be
    // considered quoted text. We exclude `gmail_quote_container` — that's
    // Gmail's compose-time wrapper for forwards which contains the user's
    // own forward note plus the actual forwarded message; only the inner
    // `.gmail_quote` is the real quoted content.
    '.gmail_quote:not(.gmail_quote_container)', // Gmail
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

const MICROSOFT_WORD_SEPARATOR_PATTERNS = [
    'border-top:solid #E1E1E1 1',
    'border-top:solid #B5C4DF 1',
    'border-block-start:solid #E1E1E1 1',
    'border-block-start:solid #B5C4DF 1',
] as const;

// Outlook's logical-property variant emits `padding-block:3...` instead of `padding:3...`,
// so the padding requirement needs to accept either form.
const WORD_SEPARATOR_PADDING_PATTERNS = ['padding:3', 'padding-block:3'] as const;

const hasMicrosoftWordSeparatorStyle = (element: Element): boolean => {
    const style = element.getAttribute('style') ?? '';

    const hasBorderNone = style.includes('border:none');
    const hasPadding = WORD_SEPARATOR_PADDING_PATTERNS.some((pattern) => style.includes(pattern));
    const hasSeparatorPattern = MICROSOFT_WORD_SEPARATOR_PATTERNS.some((pattern) => style.includes(pattern));

    return hasBorderNone && hasPadding && hasSeparatorPattern;
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

// When the separator is the only/first child of its parent, the parent is just a wrapper
// around the quoted message. Walking up captures the real surrounding content as siblings.
// Mirrors mailgun/talon's `cut_microsoft_quote` adjustment.
const walkUpIfFirstChild = (separator: Element): Element => {
    const parent = separator.parentElement;
    if (parent && parent.firstElementChild === separator) {
        return parent;
    }
    return separator;
};

const FROM_HEADER_PATTERNS = [
    'From:', // English
    'De :', // French
    'De:', // Spanish / Portuguese / French (no space)
    'Von:', // German
    'Da:', // Italian
    'Van:', // Dutch
    'Od:', // Polish / Czech / Slovak
    'От:', // Russian / Bulgarian
    'Από:', // Greek
    'Från:', // Swedish
    'Fra:', // Norwegian / Danish
    'Lähettäjä:', // Finnish
    'Feladó:', // Hungarian
    'Kimden:', // Turkish
    'מאת:', // Hebrew
    'من:', // Arabic
    'Từ:', // Vietnamese
    'จาก:', // Thai
    '差出人:', // Japanese
    '送信者:', // Japanese (alternative)
    '发件人:', // Simplified Chinese
    '寄件者:', // Traditional Chinese
    '보낸 사람:', // Korean
    '보낸사람:', // Korean (no space)
];

// Windows Mail / Outlook on iOS use long-form border-top properties instead of the shorthand
// used by Outlook 2007+. Pattern sourced from mailgun/talon's cut_microsoft_quote().
// Each axis (color/width/style) accepts either the physical `border-top-*` form or the
// logical `border-block-start-*` form — clients won't emit both at once.
const WINDOWS_MAIL_SEPARATOR_AXES = [
    ['border-top-color: rgb(229, 229, 229)', 'border-block-start-color: rgb(229, 229, 229)'],
    ['border-top-width: 1px', 'border-block-start-width: 1px'],
    ['border-top-style: solid', 'border-block-start-style: solid'],
] as const;

const hasWindowsMailSeparatorStyle = (element: Element): boolean => {
    const style = element.getAttribute('style') ?? '';
    return WINDOWS_MAIL_SEPARATOR_AXES.every((alternatives) => alternatives.some((pattern) => style.includes(pattern)));
};

// Reuses the existing Outlook 2007/2010/2013 detector (#B5C4DF / #E1E1E1) and adds the
// Windows Mail / Outlook iOS variant, matching the same selectors used by mailgun/talon.
const hasOutlookSeparatorStyle = (element: Element): boolean => {
    return hasMicrosoftWordSeparatorStyle(element) || hasWindowsMailSeparatorStyle(element);
};

const startsWithFromHeader = (text: string): boolean => {
    // Normalize non-breaking spaces (U+00A0) — French typography puts "De&nbsp;:" with
    // a non-breaking space before the colon, which would otherwise miss "De :".
    const normalized = text.replace(/\u00A0/g, ' ').trim();
    return FROM_HEADER_PATTERNS.some((pattern) => normalized.startsWith(pattern));
};

const getFollowingTextContent = (element: Element): string => {
    const ownText = element.textContent?.trim() ?? '';
    if (ownText.length > 0) {
        return ownText;
    }

    let nextSibling = element.nextSibling;
    while (nextSibling) {
        if (nextSibling.nodeType === Node.ELEMENT_NODE || nextSibling.nodeType === Node.TEXT_NODE) {
            const text = nextSibling.textContent?.trim() ?? '';
            if (text.length > 0) {
                return text;
            }
        }
        nextSibling = nextSibling.nextSibling;
    }

    return '';
};

/**
 * Some clients (notably Outlook) start the previous message with a horizontal top border
 * followed by a localized "From:" header, without wrapping it in a blockquote. When that
 * pattern is detected, wrap the border element and its following siblings in a real
 * blockquote so the rest of the pipeline treats it as the quoted message.
 */
const processOutlookTopBorderEmail = (inputDocument: Element): Element => {
    const candidates = inputDocument.querySelectorAll('div[style*="border-top"], div[style*="border-block-start"]');
    let borderElement: Element | undefined;
    for (const element of candidates) {
        if (!hasOutlookSeparatorStyle(element)) {
            continue;
        }
        if (element.closest(BLOCKQUOTE_SELECTOR)) {
            continue;
        }
        if (startsWithFromHeader(getFollowingTextContent(element))) {
            borderElement = element;
            break;
        }
    }

    if (!borderElement) {
        return inputDocument;
    }

    const blockquote = inputDocument.ownerDocument?.createElement('blockquote');
    if (!blockquote) {
        return inputDocument;
    }

    blockquote.setAttribute('type', 'cite');

    const adjustedSeparator = walkUpIfFirstChild(borderElement);
    const targetParent = adjustedSeparator.parentNode;
    const elementsToMove = collectSiblingNodesAfter(adjustedSeparator);
    moveNodesToBlockquote(elementsToMove, blockquote);

    targetParent?.appendChild(blockquote);

    return inputDocument;
};

/**
 * Try to locate the eventual blockquote present in the document no matter the expeditor of the mail.
 * Returns three pieces of HTML split around the blockquote:
 * - content: everything before the blockquote (the visible reply / forward note)
 * - blockquote: the collapsible quoted message
 * - afterBlockquote: trailing content that sat after the quote in the source (signatures
 *   like AVG "Sans virus", proton image anchors, etc.). Rendered after the blockquote.
 */
export const locateBlockquote = (
    inputDocument: Element | undefined
): [content: string, blockquote: string, afterBlockquote: string] => {
    if (!inputDocument) {
        return ['', '', ''];
    }

    // Edit Outlook messages where the quote starts with a top border + "From:" header to wrap previous message in a blockquote
    const processedDocument = processOutlookTopBorderEmail(inputDocument);
    const body = processedDocument.querySelector('body');
    const tmpDocument = body || processedDocument;

    const parentHTML = tmpDocument.innerHTML || '';
    let result: [string, string, string] | null = null;

    const testBlockquote = (blockquote: Element): [string, string, string] | null => {
        const blockquoteHTML = blockquote.outerHTML || '';
        const [beforeHTML = '', afterHTML = ''] = split(parentHTML, blockquoteHTML);
        const after = parseStringToDOM(afterHTML);

        // Skip the current candidate only if another matching blockquote follows — that
        // later one takes precedence as the "real" quote (e.g. sibling protonmail_quote
        // divs where the last one is the actual quoted message). Any other trailing
        // content (signatures, footers, images) is preserved as `afterBlockquote` so it
        // can be rendered after the collapsible blockquote.
        const hasBlockquoteAfter = after.body.querySelector(BLOCKQUOTE_SELECTOR);
        if (hasBlockquoteAfter) {
            return null;
        }

        return [beforeHTML, blockquoteHTML, afterHTML];
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

    return result || [parentHTML, '', ''];
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
    const addressSignature = exportPlainTextSignature(address?.Signature ?? '');

    const signatureIndex = addressSignature === '' ? -1 : contentBeforeBlockquote.lastIndexOf(addressSignature);

    if (signatureIndex === -1) {
        return contentBeforeBlockquote;
    }

    const protonSignaturePlainText = exportPlainTextSignature(getProtonMailSignature());

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

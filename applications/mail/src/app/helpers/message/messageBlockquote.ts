import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import { ORIGINAL_MESSAGE } from '@proton/shared/lib/mail/messages';

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
    // eslint-disable-next-line no-cond-assign
    while ((match = xpathResult?.iterateNext())) {
        result.push(match as Element);
    }
    return result;
};

/**
 * Try to locate the eventual blockquote present in the document no matter the expeditor of the mail
 * Return the HTML content split at the blockquote start
 */
export const locateBlockquote = (inputDocument: Element | undefined): [content: string, blockquote: string] => {
    if (!inputDocument) {
        return ['', ''];
    }

    const body = inputDocument.querySelector('body');
    const tmpDocument = body || inputDocument;

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

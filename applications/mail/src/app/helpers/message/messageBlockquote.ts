import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import { FORWARDED_MESSAGE, ORIGINAL_MESSAGE } from '@proton/shared/lib/mail/messages';

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

/**
 * Try to locate blockquotes on a plaintext message
 * Warning, use it carefully because this detection finds blockquotes that are built internally,
 * this won't work for external messages for example.
 */
export const locatePlaintextInternalBlockquotes = (content?: string) => {
    // helper function to build the tuple based on a match
    const getPlaintextInternalTuple = (content: string, matchIndex: number): [content: string, blockquotes: string] => {
        const messageBody = content.slice(0, matchIndex);
        const blockquotes = content.slice(matchIndex, content.length);

        return [messageBody, blockquotes];
    };

    /**
     * When building blockquotes internally, we prepend a "context string" to the previous message content.
     * This string is different based on the scenario:
     * - You're forwarding a message
     * - You're replying to a message
     * So to detect blockquotes in plaintext, we need to check both cases
     *
     * Detecting blockquotes in plaintext messages is challenging because:
     * - The content of the context string differs based on the scenario (reply or forward)
     * - Some elements are dynamic, like the date, email address or display name
     * - The full string is localized, meaning that its structure might vary depending on the language
     *
     * To accurately detect blockquotes, we need to construct a regex that combines localized strings
     * with patterns to detect dynamic parts (address, date, etc...)
     */

    // If there is no content at all, return an empty tuple
    if (!content) {
        return ['', ''];
    }

    const emailRegex = '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+';
    /**
     * FORWARD CASE, we search for content which looks like:
     * ------- Forwarded Message -------
     * From: Sender <sender@address>
     * Date: On Tuesday, 24 september 2024 at 4:00 PM
     * Subject: Email subject
     * To: Recipient <recipient@address>
     */
    const forwardMatch = content.indexOf(FORWARDED_MESSAGE);

    if (forwardMatch !== -1) {
        return getPlaintextInternalTuple(content, forwardMatch);
    }

    /**
     * REPLY CASE, we search for content which looks like:
     * On Tuesday, 24 september 2024 at 4:00 PM, Sender <sender@address> wrote:
     *
     * > previous message content
     *
     *
     * On the following regex, we try to detect the line with an email surrounded with chevron and ending with ":",
     * followed by an empty line and a line starting with ">":
     *      - ".*": All the chars before the address surrounded with chevrons
     *              => "On Tuesday, 24 september 2024 at 4:00 PM, Sender"
     *      - "<${emailRegex}>": email address
     *              => "<sender@address>"
     *      - ".*:": The end of the line ending with ":"
     *              => " wrote:"
     *      - "\s*\n\s*\n^>": The next empty line being empty + the next line starting with ">"
     */
    const replyRegex = new RegExp(`.*<${emailRegex}>.*:\\s*\\n\\s*\\n^>`, 'm');

    const replyMatch = content.match(replyRegex);

    if (!!replyMatch?.[0]) {
        const matchIndex = content.indexOf(replyMatch[0]);
        return getPlaintextInternalTuple(content, matchIndex);
    }

    return [content, ''];
};

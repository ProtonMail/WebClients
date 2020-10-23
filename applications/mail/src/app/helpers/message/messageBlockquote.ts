export const BLOCKQUOTE_SELECTORS = [
    '.protonmail_quote',
    '.gmail_quote',
    '.yahoo_quoted',
    '.gmail_extra',
    '.moz-cite-prefix',
    // '.WordSection1',
    '#isForwardContent',
    '#isReplyContent',
    '#mailcontent:not(table)',
    '#origbody',
    '#reply139content',
    '#oriMsgHtmlSeperator',
    'blockquote[type="cite"]',
    '[name="quote"]', // gmx
    '.zmail_extra', // zoho
];

const BLOCKQUOTE_TEXT_SELECTORS = ['-----Original Message-----'];

const BLOCKQUOTE_SELECTOR = BLOCKQUOTE_SELECTORS.map((selector) => `${selector}:not(:empty)`).join(',');

/**
 * Returns content before and after match in the source
 * Beware, String.prototype.split does almost the same but will not if there is several match
 */
const split = (source: string, match: string): [string, string] => {
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
 * Return the HTML content splitted at the blockquote start
 */
export const locateBlockquote = (inputDocument: Element | undefined): [string, string] => {
    if (!inputDocument) {
        return ['', ''];
    }

    const body = inputDocument.querySelector('body');
    const document = body || inputDocument;

    const parentHTML = document.innerHTML || '';
    const parentText = document.textContent || '';
    let result: [string, string] | null = null;

    const testBlockquote = (blockquote: Element) => {
        const blockquoteText = blockquote.textContent || '';
        const [beforeText = '', afterText = ''] = split(parentText, blockquoteText);

        if (beforeText.trim().length && !afterText.trim().length) {
            const blockquoteHTML = blockquote.outerHTML || '';
            const [beforeHTML = ''] = split(parentHTML, blockquoteHTML);
            return [beforeHTML, blockquoteHTML] as [string, string];
        }

        return null;
    };

    // Standard search with a composed query selector
    const blockquotes = [...document.querySelectorAll(BLOCKQUOTE_SELECTOR)];
    blockquotes.forEach((blockquote) => {
        if (result === null) {
            result = testBlockquote(blockquote);
        }
    });

    // Second search based on text content with xpath
    if (result === null) {
        BLOCKQUOTE_TEXT_SELECTORS.forEach((text) => {
            if (result === null) {
                searchForContent(document, text).forEach((blockquote) => {
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

import { htmlToMarkdown } from '@proton/mail-message/helpers/assistant/markdown';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

import { simplifyHTML } from './html';
import { replaceURLs } from './url';

// Prepare content to be send to the AI model
// We transform the HTML content to Markdown
export const prepareContentToModel = (html: string, uid: string, messageID: string): string => {
    const dom = parseStringToDOM(html);
    const simplifiedDom = simplifyHTML(dom);
    const domWithReplacedURLs = replaceURLs(simplifiedDom, uid, messageID);
    const markdown = htmlToMarkdown(domWithReplacedURLs);
    return markdown;
};

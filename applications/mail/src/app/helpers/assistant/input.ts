import { htmlToMarkdown } from '@proton/mail-message/helpers/assistant/markdown';
import { replaceURLs } from '@proton/mail-message/helpers/assistant/url';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

import config from '../../config';
import { simplifyHTML } from './html';

// Prepare content to be send to the AI model
// We transform the HTML content to Markdown
export const prepareContentToModel = (html: string, uid: string, messageID: string): string => {
    const dom = parseStringToDOM(html);
    const simplifiedDom = simplifyHTML(dom);
    const domWithReplacedURLs = replaceURLs(simplifiedDom, uid, messageID, config.API_URL);
    const markdown = htmlToMarkdown(domWithReplacedURLs);
    return markdown;
};

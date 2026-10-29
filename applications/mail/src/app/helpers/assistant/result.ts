import { markdownToHTML } from '@proton/mail-message/helpers/assistant/markdown';
import { sanitizeMessage } from '@proton/sanitize/purify';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

import { restoreURLs } from './url';

// Prepare generated markdown result before displaying it
export const parseModelResult = (markdownReceived: string, messageID: string) => {
    const html = markdownToHTML(markdownReceived);
    const dom = parseStringToDOM(html);
    const domWithRestoredURLs = restoreURLs(dom, messageID);
    const sanitized = sanitizeMessage(domWithRestoredURLs.body.innerHTML);
    return sanitized;
};

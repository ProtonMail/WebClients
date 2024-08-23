import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import { message } from '@proton/shared/lib/sanitize';

import { markdownToHTML } from './markdown';
import { restoreURLs } from './url';

// Prepare generated markdown result before displaying it
export const parseModelResult = (markdownReceived: string) => {
    const html = markdownToHTML(markdownReceived);
    const dom = parseStringToDOM(html);
    const domWithRestoredURLs = restoreURLs(dom);
    const sanitized = message(domWithRestoredURLs.body.innerHTML);
    return sanitized;
};

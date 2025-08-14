import { parse as tldParse } from 'tldts';

import type { SearchItem } from '../../../../../lib/toolCall/types';

export const getDomain = (result: SearchItem | null): string | null => {
    if (!result) {
        return null;
    } else {
        return tldParse(result.url)?.domain;
    }
};

export const decodeHtml = (() => {
    const txt = document.createElement('textarea');
    return function (html: string) {
        txt.innerHTML = html;
        return txt.value;
    };
})();

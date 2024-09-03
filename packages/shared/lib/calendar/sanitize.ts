import DOMPurify from 'dompurify';

const addRelNoopenerAndTargetBlank = (node: Element) => {
    if (node.tagName === 'A') {
        node.setAttribute('rel', 'noopener noreferrer');
        node.setAttribute('target', '_blank');
    }
};

export const restrictedCalendarSanitize = (source: string) => {
    DOMPurify.clearConfig();
    DOMPurify.addHook('afterSanitizeAttributes', addRelNoopenerAndTargetBlank);

    const sanitizedContent = DOMPurify.sanitize(source, {
        ALLOWED_TAGS: ['a', 'b', 'em', 'br', 'i', 'u', 'ul', 'ol', 'li', 'span', 'p'],
        ALLOWED_ATTR: ['href'],
    });

    DOMPurify.removeHook('afterSanitizeAttributes');

    return sanitizedContent;
};

const validTags: Set<string> = new Set([
    'a',
    'abbr',
    'acronym',
    'address',
    'applet',
    'area',
    'article',
    'aside',
    'audio',
    'b',
    'base',
    'basefont',
    'bdi',
    'bdo',
    'big',
    'blockquote',
    'body',
    'br',
    'button',
    'canvas',
    'caption',
    // 'center', // Deprecated
    'cite',
    'code',
    'col',
    'colgroup',
    'data',
    'datalist',
    'dd',
    'del',
    'details',
    'dfn',
    'dialog',
    'dir',
    'div',
    'dl',
    'dt',
    'em',
    'embed',
    'fieldset',
    'figcaption',
    'figure',
    'font',
    'footer',
    'form',
    'frame',
    'frameset',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'head',
    'header',
    'hr',
    'html',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'label',
    'legend',
    'li',
    'link',
    'main',
    'map',
    'mark',
    'meta',
    'meter',
    'nav',
    'noframes',
    'noscript',
    'object',
    'ol',
    'optgroup',
    'option',
    'output',
    'p',
    'param',
    'picture',
    'pre',
    'progress',
    'q',
    'rp',
    'rt',
    'ruby',
    's',
    'samp',
    'script',
    'section',
    'select',
    'small',
    'source',
    'span',
    'strike',
    'strong',
    'style',
    'sub',
    'summary',
    'sup',
    'svg',
    'table',
    'tbody',
    'td',
    'template',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'time',
    'title',
    'tr',
    'track',
    'tt',
    'u',
    'ul',
    'var',
    'video',
    'wbr',
]);

const escapeBrackets = (input: string): string => {
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

const HTML_TAG_PATTERN: RegExp = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

export const escapeInvalidHtmlTags = (input: string): string => {
    if (!input) {
        return '';
    }

    let result = '';
    let lastIndex = 0;

    // Replace is only used to iterate over all matches
    input.replace(HTML_TAG_PATTERN, (match, tagName, offset) => {
        // Append the part of the string before the current match
        result += escapeBrackets(input.slice(lastIndex, offset));
        // Append the current match (HTML tag) if it's valid, otherwise escape it
        result += validTags.has(tagName.toLowerCase()) ? match : escapeBrackets(match);
        // Update lastIndex to the end of the current match
        lastIndex = offset + match.length;
        // Return the match as is
        return match;
    });

    // Append any remaining part of the string after the last match
    result += escapeBrackets(input.slice(lastIndex));

    return result;
};

export const stripAllTags = (source: string) => {
    const html = escapeInvalidHtmlTags(source);
    const sanitized = restrictedCalendarSanitize(html);
    const div = document.createElement('DIV');
    div.style.whiteSpace = 'pre-wrap';
    div.innerHTML = sanitized;
    div.querySelectorAll('a').forEach((element) => {
        element.innerText = element.href || element.innerText;
    });
    // Append it to force a layout pass so that innerText returns newlines
    document.body.appendChild(div);
    const result = div.innerText;
    document.body.removeChild(div);
    return result;
};

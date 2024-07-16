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

export const stripAllTags = (source: string) => {
    const html = restrictedCalendarSanitize(source);
    const div = document.createElement('DIV');
    div.style.whiteSpace = 'pre-wrap';
    div.innerHTML = html;
    div.querySelectorAll('a').forEach((element) => {
        element.innerText = element.href || element.innerText;
    });
    // Append it to force a layout pass so that innerText returns newlines
    document.body.appendChild(div);
    const result = div.innerText;
    document.body.removeChild(div);
    return result;
};

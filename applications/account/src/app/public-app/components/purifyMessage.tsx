import DOMPurify from 'dompurify';

import { isElement } from '@proton/shared/lib/helpers/dom';

const sanitize = (msg: string, linkClassName?: string) => {
    const sanitizedElement = DOMPurify.sanitize(msg, {
        RETURN_DOM: true,
        ALLOWED_TAGS: ['b', 'a', 'i', 'em', 'strong', 'br', 'p', 'span'],
        ALLOWED_ATTR: ['href'],
    });

    if (sanitizedElement instanceof Element) {
        sanitizedElement.querySelectorAll('a').forEach((node) => {
            if (node.tagName === 'A') {
                node.setAttribute('rel', 'noopener noreferrer');
                node.setAttribute('target', '_blank');
                if (linkClassName) {
                    node.setAttribute('class', linkClassName);
                }
            }
        });
    }

    return sanitizedElement;
};

const containsHTML = (el?: Node): el is Element => {
    return Boolean(el?.childNodes && Array.from(el.childNodes).some(isElement));
};

/**
 * Renders an API error message, which can contain a few HTML tags such as links.
 */
export const purifyMessage = (msg: string, { linkClassName }: { linkClassName?: string } = {}) => {
    const sanitizedElement = sanitize(msg, linkClassName);

    if (containsHTML(sanitizedElement)) {
        return <span dangerouslySetInnerHTML={{ __html: sanitizedElement.innerHTML }} />;
    }

    return <>{msg}</>;
};

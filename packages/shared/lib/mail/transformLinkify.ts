import LinkifyIt from 'linkify-it';

const linkifyInstance = new LinkifyIt();

const htmlEntities = (str = '') => {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

/**
 * Convert plain text content with links to content with html links
 * Input : `hello http://www.protonmail.com`
 * Output : `hello <a target="_blank" rel="noreferrer nofollow noopener" href="http://protonmail.com">http://protonmail.com</a>`
 */
export const transformLinkify = (content = '', target = '_blank', rel = 'noreferrer nofollow noopener') => {
    const matches = linkifyInstance.match(content);

    if (!matches) {
        return htmlEntities(content);
    }

    let last = 0;
    const result = matches.reduce<string[]>((result, match) => {
        if (last < match.index) {
            result.push(htmlEntities(content.slice(last, match.index)));
        }
        result.push(`<a target="${target}" rel="${rel}" href="`);
        result.push(match.url);
        result.push('">');
        result.push(match.text);
        result.push('</a>');

        last = match.lastIndex;

        return result;
    }, []);

    if (last < content.length) {
        result.push(htmlEntities(content.slice(last)));
    }

    return result.join('');
};

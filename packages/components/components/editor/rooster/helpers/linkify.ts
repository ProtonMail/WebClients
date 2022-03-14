import LinkifyIt from 'linkify-it';

/**
 * @{link https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/}
 */
const htmlEntities = (str = '') => {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

const linkifyInstance = new LinkifyIt();

/**
 * Convert plain text links to html links
 */
export const linkify = (content = '') => {
    const matches = linkifyInstance.match(content);

    if (!matches) {
        return htmlEntities(content);
    }

    let last = 0;
    const result = matches.reduce<string[]>((result, match) => {
        if (last < match.index) {
            result.push(htmlEntities(content.slice(last, match.index)));
        }
        result.push('<a target="_blank" rel="noreferrer nofollow noopener" href="');
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

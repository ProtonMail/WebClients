import LinkifyIt from 'linkify-it';

const linkifyInstance = new LinkifyIt();

/**
 * Convert plain text links to html links
 */
export const linkify = (content = '') => {
    const matches = linkifyInstance.match(content);

    if (!matches) {
        return content;
    }

    let last = 0;
    const result = matches.reduce<string[]>((result, match) => {
        if (last < match.index) {
            result.push(content.slice(last, match.index));
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
        result.push(content.slice(last));
    }

    return result.join('');
};

import LinkifyIt from 'linkify-it';

const linkify = new LinkifyIt();

const escape = (str) =>
    str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

/**
 * Auto link content.
 * @param {String} content
 * @returns {string}
 */
export default (content = '') => {
    const matches = linkify.match(content);

    if (!matches) {
        return content;
    }

    let last = 0;
    const result = matches.reduce((result, match) => {
        if (last < match.index) {
            result.push(escape(content.slice(last, match.index)));
        }
        result.push('<a target="_blank" rel="noreferrer nofollow noopener" href="');
        result.push(escape(match.url));
        result.push('">');
        result.push(escape(match.text));
        result.push('</a>');

        last = match.lastIndex;

        return result;
    }, []);

    if (last < content.length) {
        result.push(escape(content.slice(last)));
    }

    return result.join('');
};

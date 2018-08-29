import _ from 'lodash';
import LinkifyIt from 'linkify-it';

const linkify = new LinkifyIt();

/**
 * Auto link content.
 * @param {String} content
 * @returns {string}
 */
export default (content = '') => {
    const matches = linkify.match(content);

    if (!matches) {
        return _.escape(content);
    }

    let last = 0;
    const result = matches.reduce((result, match) => {
        if (last < match.index) {
            result.push(_.escape(content.slice(last, match.index)));
        }
        result.push('<a target="_blank" rel="noreferrer nofollow noopener" href="');
        result.push(_.escape(match.url));
        result.push('">');
        result.push(_.escape(match.text));
        result.push('</a>');

        last = match.lastIndex;

        return result;
    }, []);

    if (last < content.length) {
        result.push(_.escape(content.slice(last)));
    }

    return result.join('');
};

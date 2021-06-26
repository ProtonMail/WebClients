import LinkifyIt from 'linkify-it';
import { htmlEntities } from '../string';

const linkifyInstance = new LinkifyIt();

// Reference Angular/src/helpers/linkifyHelper.js

/**
 * Auto link content.
 */
export const transformLinkify = (content = '') => {
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
        result.push(htmlEntities(match.url));
        result.push('">');
        result.push(htmlEntities(match.text));
        result.push('</a>');

        last = match.lastIndex;

        return result;
    }, []);

    if (last < content.length) {
        result.push(htmlEntities(content.slice(last)));
    }

    return result.join('');
};

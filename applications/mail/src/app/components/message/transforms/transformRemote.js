import { flow, filter, reduce } from 'lodash/fp';

import { SHOW_IMAGES } from 'proton-shared/lib/constants';

const WHITELIST = ['notify@protonmail.com'];

// const { dispatcher } = dispatchers(['message.open']);

const ATTRIBUTES = ['url', 'xlink:href', 'srcset', 'src', 'svg', 'background', 'poster'].map(
    (name) => `proton-${name}`
);

const REGEXP_FIXER = (() => {
    const str = ATTRIBUTES.map((key) => {
        if (key === 'proton-src') {
            return `${key}=(?!"(cid|data):)`;
        }
        return key;
    }).join('|');
    return `(${str})`;
})();

/**
 * Find inside the current parser DOM every content escaped
 * and build a list of Object <attribute>:<value> but don't parse them if
 * it is an embedded content.
 * As we have many differents attributes we create a list
 * @param  {Node} html parser
 * @return {Array}
 */
function prepareInjection(html) {
    // Query selector
    const selector = ATTRIBUTES.map((attr) => {
        const [key] = attr.split(':');
        return `[${key}]`;
    })
        .concat('[style]')
        .join(', ');

    /**
     * Create a map of every proton-x attribute and its value
     * @param  {Node} node Current element
     * @return {Object}
     */
    const mapAttributes = (node) => {
        return flow(
            filter((attr) => ATTRIBUTES.indexOf(attr.name) !== -1),
            reduce((acc, attr) => ((acc[`${attr.name}`] = attr.value), acc), {})
        )(node.attributes);
    };

    const $list = [].slice.call(html.querySelectorAll(selector));

    // Create a list containing a map of every attributes (proton-x) per node
    const attributes = $list.reduce((acc, node) => {
        if (node.hasAttribute('proton-src')) {
            const src = node.getAttribute('proton-src');

            // We don't want to unescape attachments or inline embedded as we are going to process them later
            if (src.indexOf('cid:') !== -1) {
                return acc;
            }
            if (src.indexOf('data:') !== -1) {
                return acc;
            }
        }
        acc.push(mapAttributes(node));
        return acc;
    }, []);

    return attributes;
}

export const transformRemote = (html, message, { action, mailSettings }) => {
    const showImages =
        message.showImages ||
        mailSettings.ShowImages & SHOW_IMAGES.REMOTE ||
        WHITELIST.includes(message.Sender.Address);
    const content = html.innerHTML;

    // Bind the boolean only if there are something
    if (new RegExp(REGEXP_FIXER, 'g').test(content)) {
        message.showImages = showImages;
    }

    if (showImages) {
        // If load:manual we use a custom directive to inject the content
        if (action === 'user.inject') {
            // const list = prepareInjection(html);
            prepareInjection(html);
            // const hasSVG = /svg/.test(html.innerHTML);
            // if (list.length || hasSVG) {
            //     dispatcher['message.open']('remote.injected', { action, list, message, hasSVG });
            // }
        } else {
            html.innerHTML = content.replace(new RegExp(REGEXP_FIXER, 'g'), (match, $1) => $1.substring(7));
        }
    }
    return html;
};

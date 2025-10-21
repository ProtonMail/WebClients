/* eslint-env es6 */
import { createClassNameRule } from './lib/deprecate-classname-utils.js';

const deprecatedClasses = [
    {
        pattern: /\b(on-(tiny-mobile|mobile|tablet|desktop)-)?[m][btlrxy]?\d+(-\d+)?\b/,
        getMessage: (match) =>
            `"${match}" is deprecated. Please migrate to the new margin utilities https://design-system.protontech.ch/?path=/docs/css-utilities-margin--margin`,
    },
    {
        pattern: /\b(on-(tiny-mobile|mobile|tablet|desktop)-)?[p][btlrxy]?\d+(-\d+)?\b/,
        getMessage: (match) =>
            `"${match}" is deprecated. Please migrate to the new padding utilities https://design-system.protontech.ch/?path=/docs/css-utilities-padding--padding`,
    },
    {
        pattern: /\b.*flex-gap.*\b/,
        getMessage: (match) =>
            `"${match}" is deprecated. Please migrate to the new gap utilities https://design-system.protontech.ch/?path=/docs/css-utilities-gap--gap`,
    },
];

export default {
    meta: {
        docs: {
            description:
                'The old spacing system classes are deprecated, please use the new mobile-first spacing system.',
            url: 'https://design-system.protontech.ch/?path=/docs/css-utilities-margin--margin',
        },
    },

    create: createClassNameRule(deprecatedClasses),
};

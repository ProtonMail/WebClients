/* eslint-env es6 */
import { createClassNameRule } from './lib/deprecate-classname-utils.js';

const deprecatedClasses = [
    {
        pattern: /\b((min|max)-)?w\d+(p|e|r|ch)?\b/,
        getMessage: (match) =>
            `"${match}" is deprecated. Please migrate to the new sizing utilities https://design-system.protontech.ch/?path=/docs/css-utilities-sizing--fractions`,
    },
    {
        pattern: /\bmin-h\d+e\b/,
        getMessage: (match) =>
            `"${match}" is deprecated. Please migrate to the new sizing utilities https://design-system.protontech.ch/?path=/docs/css-utilities-sizing--fractions`,
    },
    {
        pattern: /\bicon-\d+p\b/,
        getMessage: (match) =>
            `"${match}" is deprecated. Please use "icon-size-*" utility, based on the new sizing framework https://design-system.protontech.ch/?path=/docs/components-icon--basic#sizing`,
    },
];

export default {
    meta: {
        docs: {
            description: 'The old sizing system classes are deprecated, please use the new mobile-first sizing system.',
            url: 'https://design-system.protontech.ch/?path=/docs/css-utilities-sizing--fractions',
        },
    },

    create: createClassNameRule(deprecatedClasses),
};

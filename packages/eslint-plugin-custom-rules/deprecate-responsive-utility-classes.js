/* eslint-env es6 */
import { createClassNameRule } from './lib/deprecate-classname-utils.js';

const deprecatedClasses = [
    {
        pattern: /\b(on|no|auto)-(tiny-mobile|mobile|tablet|desktop)(-)?\b/,
        getMessage: (match) =>
            `"${match}" is deprecated. Please migrate to the new responsive utilities https://design-system.protontech.ch/?path=/docs/css-utilities-responsive--responsive`,
    },
];

export default {
    meta: {
        docs: {
            description:
                'The old responsive system classes are deprecated, please use the new mobile-first responsive system.',
            url: 'https://design-system.protontech.ch/?path=/docs/css-utilities-responsive--responsive',
        },
    },

    create: createClassNameRule(deprecatedClasses),
};

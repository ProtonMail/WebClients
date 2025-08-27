/* eslint-env es6 */
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
        type: 'suggestion',
        docs: {
            description:
                'The old spacing system classes are deprecated, please use the new mobile-first spacing system.',
            url: 'https://design-system.protontech.ch/?path=/docs/css-utilities-margin--margin',
        },
    },
    create: (context) => {
        return {
            Literal(node) {
                const { value } = node;
                if (!value || !value.split) {
                    return;
                }

                const classes = new Set(value.split(' '));
                classes.forEach((className) => {
                    deprecatedClasses.forEach(({ pattern, getMessage }) => {
                        const match = pattern.exec(className);

                        if (match) {
                            const message = getMessage(match[0]);

                            context.report({
                                node,
                                message,
                            });
                        }
                    });
                });
            },
        };
    },
};

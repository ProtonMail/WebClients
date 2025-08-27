/* eslint-env es6 */
const deprecatedClasses = [
    {
        pattern: /\b(on|no|auto)-(tiny-mobile|mobile|tablet|desktop)(-)?\b/,
        getMessage: (match) =>
            `"${match}" is deprecated. Please migrate to the new responsive utilities https://design-system.protontech.ch/?path=/docs/css-utilities-responsive--responsive`,
    },
];

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'The old responsive system classes are deprecated, please use the new mobile-first responsive system.',
            url: 'https://design-system.protontech.ch/?path=/docs/css-utilities-responsive--responsive',
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

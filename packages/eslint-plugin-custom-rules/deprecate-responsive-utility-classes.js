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
        docs: {
            description:
                'The old responsive system classes are deprecated, please use the new mobile-first responsive system.',
            url: 'https://design-system.protontech.ch/?path=/docs/css-utilities-responsive--responsive',
        },
    },

    create: (context) => {
        return {
            JSXAttribute(node) {
                // We only care about attributes named "className"
                if (node.name.name !== 'className') {
                    return;
                }

                const literal = node.value;
                if (!literal || literal.type !== 'Literal') {
                    return;
                }

                const value = literal.value;
                if (typeof value !== 'string') {
                    return;
                }

                // Split value safely into whitespace‑separated classes
                const classes = new Set(value.split(/\s+/).filter(Boolean));

                // Loop through your deprecated patterns list
                classes.forEach((className) => {
                    deprecatedClasses.forEach(({ pattern, getMessage }) => {
                        const match = pattern.exec(className);

                        if (match) {
                            context.report({
                                node: literal,
                                message: getMessage(match[0]),
                            });
                        }
                    });
                });
            },
        };
    },
};

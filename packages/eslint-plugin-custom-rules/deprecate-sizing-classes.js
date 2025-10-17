/* eslint-env es6 */
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

                // Split into class names
                const classes = new Set(value.split(/\s+/).filter(Boolean));

                // Check each class against your patterns
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

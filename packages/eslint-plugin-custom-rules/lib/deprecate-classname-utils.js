/* eslint-env es6 */
export const createClassNameRule = (deprecatedClasses) => (context) => {
    return {
        JSXAttribute(node) {
            // We only care about attributes named "className"
            if (!node.name || node.name.name !== 'className') {
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
};

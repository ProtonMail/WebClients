/* eslint-env es6 */

const isValidTranslatorNode = (node) => {
    return node.callee && node.callee.type === 'Identifier' && node.callee.name === 'c' && node.arguments.length === 1;
};

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description: 'Forbid template literals in translator contexts.',
            url: 'https://ttag.js.org/docs/context.html',
        },
    },
    create: (context) => {
        return {
            CallExpression: function (node) {
                if (!isValidTranslatorNode(node)) {
                    return;
                }

                const argument = node.arguments[0];
                const argType = argument.type;

                if (argType === 'TemplateLiteral') {
                    context.report({
                        node: node,
                        message: "Don't use template literals in translator contexts.",
                        fix(fixer) {
                            // 1. Check that we have no expressions in the template literal
                            const isFixable = argument.quasis.length === 1 && argument.expressions.length === 0;

                            if (!isFixable) {
                                return [];
                            }

                            // 2. Check that we can safely fix quotes
                            const text = context.sourceCode.getText(argument);

                            let quote = "'";

                            if (text.indexOf(quote) !== -1) {
                                quote = '"';
                            }

                            if (text.indexOf(quote) !== -1) {
                                return [];
                            }

                            // 3. Replace backticks with quotes
                            const innerText = text.slice(1, -1);
                            const result = `${quote}${innerText}${quote}`;

                            return [fixer.replaceText(argument, result)];
                        },
                    });
                }
            },
        };
    },
};

/* eslint-env es6 */
const isObjectTagField = (node) => {
    return node && node.type === 'Property' && node.key && node.key.type === 'Identifier' && node.key.name === 'tag';
};

const isTestFunctionOptionsObject = (node) => {
    const isObject = node && node.type === 'ObjectExpression' && node.parent;

    if (!isObject) {
        return false;
    }

    const isFunctionWithOptionsObject = node.parent.type === 'CallExpression' && node.parent.callee;

    if (isFunctionWithOptionsObject) {
        if (node.parent.callee.name === 'test') {
            return true;
        }

        if (node.parent.callee.type === 'MemberExpression' && node.parent.callee.object) {
            const { object, name } = node.parent.callee.object;

            if (name) {
                return name === 'test';
            }

            return object && object.name === 'test';
        }
    }

    return false;
};

const reportIssue = (context, node) => {
    context.report({
        node: node,
        message: 'Test tags cannot be strings, please use the TEST_TAGS enum constant instead.',
    });
};

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Try to use the TEST_TAGS enum constant.',
        },
    },
    create: (context) => {
        return {
            Literal(node) {
                const { parent, value } = node;

                if (!parent || !value || !value.split) {
                    return;
                }

                if (value.trim().startsWith('@')) {
                    if (parent.type === 'ArrayExpression') {
                        if (isObjectTagField(parent.parent)) {
                            if (isTestFunctionOptionsObject(parent.parent.parent)) {
                                reportIssue(context, node);
                            }
                        }
                    } else if (isObjectTagField(parent)) {
                        if (isTestFunctionOptionsObject(parent.parent)) {
                            reportIssue(context, node);
                        }
                    }
                }
            },
        };
    },
};

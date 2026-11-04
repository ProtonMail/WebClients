const isJtCall = (node) => {
    return (
        node.type === 'TaggedTemplateExpression' &&
        node.tag &&
        node.tag.type === 'MemberExpression' &&
        node.tag.property &&
        node.tag.property.name === 'jt'
    );
};

const generateRandomHex = () => {
    return Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')
        .toUpperCase();
};

const hasKeyProp = (node) => {
    if (node.type === 'JSXElement') {
        return node.openingElement.attributes.some(
            (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'key'
        );
    }
    return false;
};

const findJsxElementForVariable = (variableName, context, node) => {
    const scope = context.sourceCode?.getScope?.(node) || context.getScope(node);
    const variable =
        scope.variables.find((v) => v.name === variableName) ||
        scope.upper?.variables.find((v) => v.name === variableName);

    if (variable && variable.defs.length > 0) {
        const def = variable.defs[0];
        if (def.node.type === 'VariableDeclarator' && def.node.init && def.node.init.type === 'JSXElement') {
            return def.node.init;
        }
    }
    return null;
};

const isReactElement = (node, context) => {
    // Direct JSX element
    if (node.type === 'JSXElement') {
        return true;
    }

    // Variable that might reference a JSX element
    if (node.type === 'Identifier') {
        // Find the variable declaration
        const scope = context.sourceCode?.getScope?.(node) || context.getScope(node);
        const variable =
            scope.variables.find((v) => v.name === node.name) ||
            scope.upper?.variables.find((v) => v.name === node.name);

        if (variable && variable.defs.length > 0) {
            const def = variable.defs[0];
            // Check if it's a variable declaration with JSX
            if (def.node.type === 'VariableDeclarator' && def.node.init) {
                return def.node.init.type === 'JSXElement';
            }
        }
    }

    return false;
};

/**
 * This function checks that React elements used in jt templates have a key prop.
 * When React elements are interpolated in jt templates, they need keys just like in React arrays.
 */
const ensureReactElementsHaveKey = (node, context) => {
    if (!node.quasi || !node.quasi.expressions) {
        return;
    }

    node.quasi.expressions.forEach((expression) => {
        if (isReactElement(expression, context)) {
            // Direct JSX element
            if (expression.type === 'JSXElement') {
                if (!hasKeyProp(expression)) {
                    // Missing key - provide auto-fix
                    const hex = generateRandomHex();
                    context.report({
                        node: expression,
                        message: 'React elements used in jt templates must have a key prop',
                        fix: (fixer) => {
                            const openingElement = expression.openingElement;
                            const lastAttribute = openingElement.attributes[openingElement.attributes.length - 1];
                            const insertPosition = lastAttribute
                                ? lastAttribute.range[1]
                                : openingElement.name.range[1];

                            return fixer.insertTextAfterRange(
                                [insertPosition, insertPosition],
                                ` key="eslint-autofix-${hex}"`
                            );
                        },
                    });
                }
            }
            // Variable reference to JSX element
            else if (expression.type === 'Identifier') {
                const jsxElement = findJsxElementForVariable(expression.name, context, expression);
                if (jsxElement) {
                    if (!hasKeyProp(jsxElement)) {
                        // Missing key - provide auto-fix
                        const hex = generateRandomHex();
                        context.report({
                            node: expression,
                            message: `React element variable '${expression.name}' used in jt template must have a key prop`,
                            fix: (fixer) => {
                                const openingElement = jsxElement.openingElement;
                                const lastAttribute = openingElement.attributes[openingElement.attributes.length - 1];
                                const insertPosition = lastAttribute
                                    ? lastAttribute.range[1]
                                    : openingElement.name.range[1];

                                return fixer.insertTextAfterRange(
                                    [insertPosition, insertPosition],
                                    ` key="eslint-autofix-${hex}"`
                                );
                            },
                        });
                    }
                }
            }
        }
    });
};

export default {
    meta: {
        docs: {
            description: 'Ensure proper usage of key props on React elements in jt templates',
            category: 'Possible Errors',
            recommended: true,
        },
        fixable: /** @type {'code'} */ ('code'),
    },
    create: (context) => {
        return {
            TaggedTemplateExpression(node) {
                // Check jt calls for React elements with missing key props
                if (isJtCall(node)) {
                    ensureReactElementsHaveKey(node, context);
                }
            },
        };
    },
};

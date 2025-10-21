/* eslint-env es6 */

export const createClassNameRule = (deprecatedClasses) => (context) => {
    const hasClsxPattern = deprecatedClasses?.some?.((d) => d?.pattern?.toString()?.includes?.('clsx')) ?? false;

    const patternsToCheck = hasClsxPattern
        ? deprecatedClasses
        : [
              ...deprecatedClasses,
              {
                  pattern: /\bclsx-\d+(?:-[\w]+)?\b/,
                  getMessage: (m) => `"${m}" is deprecated. Please migrate to the new CLSX-based utilities`,
              },
          ];

    const splitClasses = (str) => str.split(/\s+/).filter(Boolean);

    const extractFromNode = (node) => {
        if (!node) {
            return [];
        }

        switch (node.type) {
            case 'Literal':
                return typeof node.value === 'string' ? splitClasses(node.value) : [];
            case 'TemplateLiteral':
                return node.quasis.map((q) => q.value.cooked || '').flatMap(splitClasses);
            case 'ArrayExpression':
                return node.elements.flatMap(extractFromNode);
            default:
                return [];
        }
    };

    const isClsx = (expr) =>
        expr?.type === 'CallExpression' &&
        ((expr.callee.type === 'Identifier' && expr.callee.name === 'clsx') || expr.callee.property?.name === 'clsx');

    const extractClasses = (expr) => (!expr || !isClsx(expr) ? [] : expr.arguments.flatMap(extractFromNode));

    return {
        JSXAttribute(node) {
            if (node.name?.name !== 'className') {
                return;
            }

            const value = node.value;

            let collected = [];
            if (value?.type === 'Literal') {
                collected = extractFromNode(value);
            } else if (value?.type === 'JSXExpressionContainer') {
                collected = extractClasses(value.expression);
            }

            [...new Set(collected)].forEach((cls) => {
                for (const { pattern, getMessage } of patternsToCheck) {
                    const match = pattern.exec(cls);
                    if (match) {
                        context.report({
                            node: value,
                            message: getMessage(match[0]),
                        });
                    }
                }
            });
        },
    };
};

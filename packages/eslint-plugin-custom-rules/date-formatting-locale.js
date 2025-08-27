/* eslint-env es6 */

/*
import { format } from 'date-fns'
import { dateLocale } from '@proton/shared/lib/i18n';

// ❌ Wrong - missing locale parameter
format(new Date(), 'PP')

// ✅ Correct - includes locale parameter
format(new Date(), 'PP', { locale: dateLocale })
*/

const isFormatCall = (node) => {
    return node.callee && node.callee.type === 'Identifier' && node.callee.name === 'format';
};

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Enforce locale parameter in date-fns format function calls',
            category: 'Best Practices',
            recommended: true,
            url: null,
        },
        fixable: null,
        schema: [],
    },
    create: (context) => {
        // Track if format is imported from date-fns and not shadowed
        let formatFromDateFns = false;
        let isShadowed = false;

        return {
            // Check import declarations
            ImportDeclaration(node) {
                if (node.source.value === 'date-fns') {
                    node.specifiers.forEach((specifier) => {
                        if (
                            specifier.type === 'ImportSpecifier' &&
                            specifier.imported.name === 'format' &&
                            specifier.local.name === 'format'
                        ) {
                            formatFromDateFns = true;
                        }
                    });
                }
            },

            // Track variable declarations that might shadow format
            VariableDeclarator(node) {
                if (node.id.type === 'Identifier' && node.id.name === 'format') {
                    isShadowed = true;
                }
            },

            // Track function declarations that might shadow format
            FunctionDeclaration(node) {
                if (node.id && node.id.name === 'format') {
                    isShadowed = true;
                }
            },

            CallExpression(node) {
                // Only check if format is from date-fns and not shadowed
                if (formatFromDateFns && !isShadowed && isFormatCall(node)) {
                    // Check if the function has exactly 2 arguments (missing locale)
                    if (node.arguments.length === 2) {
                        context.report({
                            node,
                            message: 'The format function should include a locale parameter as the third argument',
                        });
                    }
                }
            },
        };
    },
};

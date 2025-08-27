/* eslint-env es6 */

/*

// ❌ Wrong
c('Context').ngettext(
    msgid`Hello ${n}`,
    msgid`Hello ${n}`, // Error: msgid template tag should only be used in the first argument of ngettext
    n
)

// ❌ Wrong
c('Context').ngettext(
    `Hello ${n}`, // The first argument of ngettext must have the msgid template tag
    `Hello ${n}`,
    n
)

// That's a bug of ttag, but we still must take it into account
// ❌ Wrong
const start = c('Info').ngettext(
    msgid`Subscription auto-renews every month.`, // this string doesn't include the variable {cycle}
    `Subscription auto-renews every ${cycle} months.`,
    cycle
)

// That's a bug of ttag, but we still must take it into account
// ❌ Wrong
const start = c('Info').ngettext(
    msgid`Subscription length is ${cycle} month. Then it will be renewed for ${cycle} month.`, // this string contains the variable {cycle} twice.
    `Subscription length is ${cycle} months. Then it will be renewed for ${cycle} months.`, // this string contains the variable {cycle} twice.
    cycle
)

// ✅ Correct
c('Context').ngettext(
    msgid`Hello ${n}`,
    `Hello ${n}`,
    n
)

*/

const isNgettextCall = (node) => {
    return (
        node.callee &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property &&
        node.callee.property.name === 'ngettext' &&
        node.arguments &&
        node.arguments.length >= 3
    );
};

const isMsgidTaggedTemplate = (node) => {
    return node.type === 'TaggedTemplateExpression' && node.tag && node.tag.name === 'msgid';
};

const getTemplateExpressions = (node, context) => {
    if (node.type === 'TemplateLiteral') {
        return node.expressions.map((exp) => {
            if (exp.type === 'MemberExpression') {
                return context.getSourceCode().getText(exp);
            }
            return exp.name || exp.value;
        });
    }
    if (node.type === 'TaggedTemplateExpression' && node.quasi) {
        return node.quasi.expressions.map((exp) => {
            if (exp.type === 'MemberExpression') {
                return context.getSourceCode().getText(exp);
            }
            return exp.name || exp.value;
        });
    }
    return [];
};

/**
 * This function ensures that the counter variable is used in both the singular and plural forms.
 * This is a bug of ttag, but we still must take it into account. It can be removed once the bug is fixed in ttag.
 * Namely, the first agrument of ngettext can have no variable when the bug is fixed. Example:
 *   const start = c('Info').ngettext(
 *       msgid`Subscription auto-renews every month.`, // this string doesn't include the variable {cycle}
 *       `Subscription auto-renews every ${cycle} months.`,
 *       cycle
 *   )
 */
const ensureLastArgumentIsUsed = (node, context, singularArg, pluralArgs, counterArg) => {
    // Get the counter variable name
    const counterName = counterArg.name;
    if (!counterName) {
        return; // Skip if counter is not a simple identifier
    }

    const singularVars = new Set(getTemplateExpressions(singularArg, context));
    const pluralVarsArray = pluralArgs.map((arg) => new Set(getTemplateExpressions(arg, context)));

    // If counter is used in any form, it must be used in all forms
    const isUsedInSingular = singularVars.has(counterName);
    const isUsedInSomePlural = pluralVarsArray.some((vars) => vars.has(counterName));

    if (isUsedInSingular || isUsedInSomePlural) {
        // If it's used anywhere, it must be used everywhere
        if (!isUsedInSingular) {
            context.report({
                node: singularArg,
                message: `Counter variable '${counterName}' must be used in singular form`,
            });
        }

        pluralVarsArray.forEach((pluralVars, index) => {
            if (!pluralVars.has(counterName)) {
                context.report({
                    node: pluralArgs[index],
                    message: `Counter variable '${counterName}' must be used in plural form ${index + 1}`,
                });
            }
        });
    }
};

/**
 * This is a bug of ttag. We can't use the same variable twice in one translation.
 *
 *   const start = c('Info').ngettext(
 *       msgid`Subscription length is ${cycle} month. Then it will be renewed for ${cycle} month.`, // this string contains the variable {cycle} twice.
 *       `Subscription length is ${cycle} months. Then it will be renewed for ${cycle} months.`, // this string contains the variable {cycle} twice.
 *       cycle
 *   )
 */
const ensureVariablesAreNotUsedTwiceNgettext = (node, context, singularArg, pluralArgs) => {
    const args = [singularArg, ...pluralArgs];

    args.forEach((arg) => {
        const vars = getTemplateExpressions(arg, context);
        const countes = {};
        vars.forEach((varName) => {
            countes[varName] = (countes[varName] || 0) + 1;
            if (countes[varName] > 1) {
                context.report({
                    node: arg,
                    message: `Variable '${varName}' is used multiple times in the same translation string. This is not supported by ttag.`,
                });
            }
        });
    });
};

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Ensure proper usage of msgid template tag and counter variable in ngettext calls',
            category: 'Possible Errors',
            recommended: true,
            url: null,
        },
        fixable: null,
        schema: [],
    },
    create: (context) => {
        return {
            CallExpression(node) {
                // First check regular translation calls
                if (isNgettextCall(node)) {
                    const args = node.arguments;
                    const singularArg = args[0];
                    const pluralArgs = args.slice(1, -1);
                    const counterArg = args[args.length - 1];

                    // Check if the first argument has msgid
                    if (!isMsgidTaggedTemplate(singularArg)) {
                        context.report({
                            node: singularArg,
                            message: 'The first argument of ngettext must have the msgid template tag',
                        });
                    }

                    // Check plural forms for msgid usage
                    pluralArgs.forEach((arg) => {
                        if (isMsgidTaggedTemplate(arg)) {
                            context.report({
                                node: arg,
                                message: 'msgid template tag should only be used in the first argument of ngettext',
                            });
                        }
                    });

                    ensureLastArgumentIsUsed(node, context, singularArg, pluralArgs, counterArg);
                    ensureVariablesAreNotUsedTwiceNgettext(node, context, singularArg, pluralArgs);
                }
            },
        };
    },
};

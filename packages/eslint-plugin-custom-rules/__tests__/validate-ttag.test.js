import rule from '../validate-ttag';

const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },
    },
});

ruleTester.run('validate-ttag', rule, {
    valid: [
        // Basic correct usage - counter used in both forms
        `c('Context').ngettext(msgid\`\${n} item\`, \`\${n} items\`, n)`,
        // Multiple variables with counter
        `c('Context').ngettext(msgid\`\${count} item for \${price}\`, \`\${count} items for \${price}\`, count)`,
        // Multiple different variables in t translation (valid)
        "c('Context').t`Hello ${firstName} ${lastName}`",
        // Multiple different variables in jt translation (valid)
        "c('Warning').jt`Hello ${firstName} ${lastName}`",
        // Counter not used in either form (valid)
        `c('Error').ngettext(
            msgid\`Cannot send invitation at the moment\`,
            \`Cannot send invitations at the moment\`,
            count
        )`,
        // Property access expressions used consistently
        `c('Loading info').ngettext(
            msgid\`\${twoFAMembers.length}/\${members.length} of your organization member use two-factor authentication.\`,
            \`\${twoFAMembers.length}/\${members.length} of your organization members use two-factor authentication.\`,
            members.length
        )`,
        // Property access expressions with different text but same variables
        `c('Loading info').ngettext(
            msgid\`\${twoFAMembers.length}/\${members.length} of your organization member use two-factor authentication.\`,
            \`\${twoFAMembers.length}/\${members.length} of your family members use two-factor authentication.\`,
            members.length
        )`,
        // Extractable expressions in t/jt templates
        "c('Info').jt`Due ${invoice.dueDate} ${items[0]} ${items[index]} ${this.name} ${link}`",
        // Plain template literals are not checked
        '`Due ${format(dueTime)}`',
        // Counter as member expression or number
        "c('Info').ngettext(msgid`${list.length} item`, `${list.length} items`, list.length)",
        "c('Info').ngettext(msgid`One item`, `Many items`, 2)",
    ],
    invalid: [
        // More than 2 plural forms
        {
            code: "c('Context').ngettext(msgid`${n} item`, `${n} items`, `${n} items (many)`, n)",
            errors: [{ message: 'ngettext must have exactly 2 forms (singular and plural) but has 3' }],
        },
        // Counter is a call expression
        {
            code: "c('Info').ngettext(msgid`One item`, `Many items`, getCount())",
            errors: [
                {
                    message:
                        "CallExpression 'getCount()' can not be used as plural argument. Assign it to a variable first.",
                },
            ],
        },
        // String with only variables
        {
            code: "c('Info').jt`${link}`",
            errors: [
                { message: "Can not translate '`${link}`': it has no text outside variables, digits and punctuation." },
            ],
        },
        // Only digits and punctuation
        {
            code: "c('Placeholder').t`123.12`",
            errors: [
                { message: "Can not translate '`123.12`': it has no text outside variables, digits and punctuation." },
            ],
        },
        // Empty msgid
        {
            code: "c('Info').ngettext(msgid` ${n} `, `${n} items`, n)",
            errors: [
                { message: "Can not translate '` ${n} `': it has no text outside variables, digits and punctuation." },
            ],
        },
        // Call expression in jt template
        {
            code: "c('Info').jt`You have an open invoice on ${format(dueTime, 'PPP')} ${link}`",
            errors: [
                {
                    message:
                        "You can not use CallExpression '${format(dueTime, 'PPP')}' in localized strings. Assign it to a variable first.",
                },
            ],
        },
        // Conditional expression in t template
        {
            code: "c('Info').t`Hello ${name || 'you'}`",
            errors: [
                {
                    message:
                        "You can not use LogicalExpression '${name || 'you'}' in localized strings. Assign it to a variable first.",
                },
            ],
        },
        // Call expression in ngettext plural form
        {
            code: "c('Info').ngettext(msgid`${n} item`, `${n} items in ${getName()}`, n)",
            errors: [
                {
                    message:
                        "You can not use CallExpression '${getName()}' in localized strings. Assign it to a variable first.",
                },
            ],
        },
        // msgid in second argument
        {
            code: `c('Context').ngettext(msgid\`Hello \${n}\`, msgid\`Hello \${n}\`, n)`,
            errors: [
                {
                    message: 'msgid template tag should only be used in the first argument of ngettext',
                },
            ],
        },
        // missing msgid in first argument
        {
            code: `c('Context').ngettext(\`Hello \${n}\`, \`Hello \${n}\`, n)`,
            errors: [
                {
                    message: 'The first argument of ngettext must have the msgid template tag',
                },
            ],
        },
        // counter missing in singular form
        {
            code: `c('Context').ngettext(msgid\`Subscription auto-renews\`, \`Subscription auto-renews every \${cycle} months\`, cycle)`,
            errors: [
                {
                    message: "Counter variable 'cycle' must be used in singular form",
                },
            ],
        },
        // counter missing in plural form
        {
            code: `c('Context').ngettext(msgid\`\${cycle} month\`, \`Multiple months\`, cycle)`,
            errors: [
                {
                    message: "Counter variable 'cycle' must be used in plural form 1",
                },
            ],
        },
        // Variable used twice in singular form
        {
            code: `c('Context').ngettext(
                msgid\`Subscription length is \${cycle} month. Then it will be renewed for \${cycle} month.\`,
                \`Subscription length is \${cycle} months.\`,
                cycle
            )`,
            errors: [
                {
                    message:
                        "Variable 'cycle' is used multiple times in the same translation string. This is not supported by ttag.",
                },
            ],
        },
        // Variable used twice in plural form
        {
            code: `c('Context').ngettext(
                msgid\`\${cycle} month\`,
                \`Subscription length is \${cycle} months. Then it will be renewed for \${cycle} months.\`,
                cycle
            )`,
            errors: [
                {
                    message:
                        "Variable 'cycle' is used multiple times in the same translation string. This is not supported by ttag.",
                },
            ],
        },
        // Property access expression used twice in singular form
        {
            code: `c('Loading info').ngettext(
                msgid\`\${members.length}/\${members.length} of your organization member use two-factor authentication.\`,
                \`\${members.length} of your organization members use two-factor authentication.\`,
                members.length
            )`,
            errors: [
                {
                    message:
                        "Variable 'members.length' is used multiple times in the same translation string. This is not supported by ttag.",
                },
            ],
        },
        // Property access expression used twice in plural form
        {
            code: `c('Loading info').ngettext(
                msgid\`\${members.length} of your organization member use two-factor authentication.\`,
                \`\${members.length}/\${members.length} of your organization members use two-factor authentication.\`,
                members.length
            )`,
            errors: [
                {
                    message:
                        "Variable 'members.length' is used multiple times in the same translation string. This is not supported by ttag.",
                },
            ],
        },
    ],
});

import rule from '../validate-ttag';

/* eslint-env es6 */

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
        // Multiple plural forms
        `c('Context').ngettext(
            msgid\`\${n} item\`,
            \`\${n} items\`,
            \`\${n} items (many)\`,
            n
        )`,
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
    ],
    invalid: [
        // msgid in second argument
        {
            code: `c('Context').ngettext(msgid\`Hello \${n}\`, msgid\`Hello \${n}\`, n)`,
            errors: [
                {
                    message: 'msgid template tag should only be used in the first argument of ngettext',
                    type: 'TaggedTemplateExpression',
                },
            ],
        },
        // missing msgid in first argument
        {
            code: `c('Context').ngettext(\`Hello \${n}\`, \`Hello \${n}\`, n)`,
            errors: [
                {
                    message: 'The first argument of ngettext must have the msgid template tag',
                    type: 'TemplateLiteral',
                },
            ],
        },
        // counter missing in singular form
        {
            code: `c('Context').ngettext(msgid\`Subscription auto-renews\`, \`Subscription auto-renews every \${cycle} months\`, cycle)`,
            errors: [
                {
                    message: "Counter variable 'cycle' must be used in singular form",
                    type: 'TaggedTemplateExpression',
                },
            ],
        },
        // counter missing in plural form
        {
            code: `c('Context').ngettext(msgid\`\${cycle} month\`, \`Multiple months\`, cycle)`,
            errors: [
                {
                    message: "Counter variable 'cycle' must be used in plural form 1",
                    type: 'TemplateLiteral',
                },
            ],
        },
        {
            code: `c('Context').ngettext(msgid\`One item\`, \`\${n} items\`, \`extra arg\`, n)`,
            errors: [
                {
                    message: "Counter variable 'n' must be used in singular form",
                    type: 'TaggedTemplateExpression',
                },
                {
                    message: "Counter variable 'n' must be used in plural form 2",
                    type: 'TemplateLiteral',
                },
            ],
        },
        {
            code: `c('Context').ngettext(msgid\`One item\`, \`\${n} items\`, 'extra arg', n)`,
            errors: [
                {
                    message: "Counter variable 'n' must be used in singular form",
                    type: 'TaggedTemplateExpression',
                },
                {
                    message: "Counter variable 'n' must be used in plural form 2",
                    type: 'Literal',
                },
            ],
        },
        // Missing counter in second plural form
        {
            code: `c('Context').ngettext(
                msgid\`\${n} item\`,
                \`\${n} items\`,
                \`many items\`,
                n
            )`,
            errors: [
                {
                    message: "Counter variable 'n' must be used in plural form 2",
                    type: 'TemplateLiteral',
                },
            ],
        },
        // Missing counter in all plural forms
        {
            code: `c('Context').ngettext(
                msgid\`\${n} item\`,
                \`items\`,
                \`many items\`,
                \`lots of items\`,
                n
            )`,
            errors: [
                {
                    message: "Counter variable 'n' must be used in plural form 1",
                    type: 'TemplateLiteral',
                },
                {
                    message: "Counter variable 'n' must be used in plural form 2",
                    type: 'TemplateLiteral',
                },
                {
                    message: "Counter variable 'n' must be used in plural form 3",
                    type: 'TemplateLiteral',
                },
            ],
        },
        // Missing counter in singular and some plural forms
        {
            code: `c('Context').ngettext(
                msgid\`item\`,
                \`\${n} items\`,
                \`many items\`,
                n
            )`,
            errors: [
                {
                    message: "Counter variable 'n' must be used in singular form",
                    type: 'TaggedTemplateExpression',
                },
                {
                    message: "Counter variable 'n' must be used in plural form 2",
                    type: 'TemplateLiteral',
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
                    type: 'TaggedTemplateExpression',
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
                    type: 'TemplateLiteral',
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
                    type: 'TaggedTemplateExpression',
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
                    type: 'TemplateLiteral',
                },
            ],
        },
    ],
});

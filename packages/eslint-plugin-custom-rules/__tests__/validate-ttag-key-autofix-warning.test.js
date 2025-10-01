import rule from '../validate-ttag-key-autofix-warning';

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

ruleTester.run('validate-ttag-key-autofix-warning', rule, {
    valid: [
        // jt templates - Valid cases (no auto-generated keys)
        // jt with React element variable that has proper key prop
        `const price = <Price key="price" currency="USD">100</Price>;
         const text = c('Addon').jt\`\${price} per domain\`;`,

        // jt with React element that has proper key prop (direct)
        `const text = c('Addon').jt\`\${<Price key="price" currency="USD">100</Price>} per domain\`;`,

        // jt with non-React elements (strings, numbers)
        `const amount = 100;
         const text = c('Addon').jt\`\${amount} per domain\`;`,

        // jt with no interpolated elements
        `const text = c('Addon').jt\`Fixed text with no variables\`;`,

        // jt with React element without key (not this rule's concern)
        `const price = <Price currency="USD">100</Price>;
         const text = c('Addon').jt\`\${price} per domain\`;`,
    ],
    invalid: [
        // Warning for auto-fixed keys - Direct JSX element
        {
            code: `const text = c('Addon').jt\`\${<Price key="eslint-autofix-ABC123" currency="USD">100</Price>} per domain\`;`,
            errors: [
                {
                    message:
                        'Auto-generated key detected. Please replace with a meaningful key name for better maintainability.',
                    type: 'JSXElement',
                },
            ],
        },

        // Warning for auto-fixed keys - Variable reference
        {
            code: `const price = <Price key="eslint-autofix-DEF456" currency="USD">100</Price>;
                   const text = c('Addon').jt\`\${price} per domain\`;`,
            errors: [
                {
                    message:
                        "Auto-generated key detected in variable 'price'. Please replace with a meaningful key name for better maintainability.",
                    type: 'Identifier',
                },
            ],
        },
    ],
});

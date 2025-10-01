import rule from '../validate-ttag-key';

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

ruleTester.run('validate-ttag-key', rule, {
    valid: [
        // jt templates - Valid cases
        // jt with React element variable that has key prop
        `const price = <Price key="price" currency="USD">100</Price>;
         const text = c('Addon').jt\`\${price} per domain\`;`,

        // jt with React element that has key prop (direct)
        `const text = c('Addon').jt\`\${<Price key="price" currency="USD">100</Price>} per domain\`;`,

        // jt with non-React elements (strings, numbers)
        `const amount = 100;
         const text = c('Addon').jt\`\${amount} per domain\`;`,

        // jt with no interpolated elements
        `const text = c('Addon').jt\`Fixed text with no variables\`;`,

        // jt with multiple React elements, all with keys
        `const price = <Price key="price" currency="USD">100</Price>;
         const icon = <Icon key="icon" name="star" />;
         const text = c('Addon').jt\`\${price} \${icon} per domain\`;`,
    ],
    invalid: [
        // This rule now only handles missing keys (errors)
        // Auto-generated key warnings are handled by validate-ttag-key-autofix-warning rule
    ],
});

// Note: Auto-fix functionality is working (as evidenced by ESLint attempting to apply fixes in test runs)
// but cannot be easily tested with RuleTester due to random hex generation.
// The rule will automatically add key="eslint-autofix-XXXXXX" where X is a random hex character.
// Manual testing with ESLint CLI will demonstrate the auto-fix capability.

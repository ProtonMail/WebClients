import rule from '../use-subscription-modal-loading';

/* eslint-env es6 */

const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
});

ruleTester.run('use-subscription-modal-loading', rule, {
    valid: [
        // Destructures both values
        `const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();`,
        `const [open, loading] = useOptionalSubscriptionModal();`,
        // Hole for first, but second present
        `const [, loading] = useSubscriptionModal();`,
        // Rest element after first captures loading
        `const [open, ...rest] = useSubscriptionModal();`,
        // Unrelated hooks are ignored
        `const [value] = useState(false);`,
        `const [open] = useSubscriptionModalRaw();`,
        `const [open] = useOptionalSubscriptionModalRaw();`,
        // Not a destructuring assignment
        `const modal = useSubscriptionModal();`,
    ],
    invalid: [
        {
            code: `const [openSubscriptionModal] = useSubscriptionModal();`,
            errors: [{ messageId: 'missingLoadingSubscriptionModal' }],
        },
        {
            code: `const [openSubscriptionModal] = useOptionalSubscriptionModal();`,
            errors: [{ messageId: 'missingLoadingOptionalSubscriptionModal' }],
        },
        // Empty destructuring
        {
            code: `const [] = useSubscriptionModal();`,
            errors: [{ messageId: 'missingLoadingSubscriptionModal' }],
        },
    ],
});

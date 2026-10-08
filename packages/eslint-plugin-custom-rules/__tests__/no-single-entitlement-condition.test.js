import rule from '../no-single-entitlement-condition';

const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
});

ruleTester.run('no-single-entitlement-condition', rule, {
    valid: [
        // Already the dedicated single-name question
        `r.hasEntitlement(EntitlementName.Business);`,
        // More than one entitlement
        `r.hasMatchingSubscription({ includes: [EntitlementName.MultiUser, EntitlementName.Business] });`,
        // A single inclusion, but the exclusion carries meaning
        `r.hasMatchingSubscription({ includes: [EntitlementName.MultiUser], excludes: [EntitlementName.Business] });`,
        // Spread conditions are unknown at lint time
        `r.hasMatchingSubscription({ includes: [...names] });`,
        `r.hasMatchingSubscription(conditions);`,
        // Arguments that are not an inline `{ includes: [...] }` condition
        `element.hasMatchingSubscription(':empty');`,
        `snapshot.hasMatchingSubscription({ mnemonicRecovery: 'checkMnemonic' });`,
    ],
    invalid: [
        // Reported without a fixer throughout: `hasEntitlement` reads a different source on the org/user
        // resolver, so choosing it is the author's call. `output: null` asserts nothing is rewritten.
        {
            code: `r.hasMatchingSubscription({ includes: [EntitlementName.Business] });`,
            output: null,
            errors: [{ messageId: 'singleEntitlementCondition' }],
        },
        {
            code: `r.hasMatchingSubscription({ includes: [EntitlementName.Business], excludes: [] });`,
            output: null,
            errors: [{ messageId: 'singleEntitlementCondition' }],
        },
        {
            code: `entitlements.findSubscriptionsMatching({ includes: [EntitlementName.Business] });`,
            output: null,
            errors: [{ messageId: 'singleEntitlementCondition' }],
        },
    ],
});

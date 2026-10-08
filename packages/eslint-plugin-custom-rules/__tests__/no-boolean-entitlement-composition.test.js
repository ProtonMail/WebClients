import path from 'node:path';

import rule from '../no-boolean-entitlement-composition';

const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
});

const registryFilename = path.resolve(__dirname, '../../payments/core/entitlements/checks.ts');

// A real path inside the monorepo, so the rule finds the check registry and knows the names of the
// checks bound onto the resolver (`isBusiness`, `hasVpn`, ...). Not the registry itself, which the rule
// skips entirely.
const filename = path.resolve(__dirname, '../../payments/core/entitlements/resolver.ts');

ruleTester.run('no-boolean-entitlement-composition', rule, {
    valid: [
        { code: `const isBusiness = r.hasEntitlement(EntitlementName.Business);`, filename },
        { code: `if (entitlements.isBusiness) { upsell(); }`, filename },
        // The registry is where a combination gets its name, so it is not checked at all
        {
            code: `const checks = { isBusiness: (r) => r.hasEntitlement(A) && !r.hasEntitlement(B) };`,
            filename: registryFilename,
        },
        // A single check may be negated: it still asks about one entitlement
        { code: `const isPersonalAccount = !r.hasEntitlement(EntitlementName.Business);`, filename },
        { code: `const hasPassBusiness = !!r.quantityTotal(EntitlementName.PassBusiness);`, filename },
        { code: `if (!entitlements.isMspEligible) { skipUnprivatization(); }`, filename },
        // Comparisons on a quantity are not boolean composition of checks
        { code: `const many = r.quantityTotal(EntitlementName.MaxSubsidiaries) > 3;`, filename },
        { code: `const hasSeats = r.quantityForMember(name) >= seats;`, filename },
        // Unrelated booleans may still be combined freely
        { code: `const show = isAdmin && !loading;`, filename },
        { code: `const visible = element.hasMatchingSubscription(':empty') && !hidden;`, filename },
        // Non-entitlement properties of an entitlement-shaped object
        { code: `const ready = entitlements.loading && user.isAdmin;`, filename },
        // One check next to conditions the registry cannot express
        {
            code: `const showFeaturesColumn =
                !hasExternalMemberCapableB2BPlan ||
                hasDriveB2BPlan ||
                entitlements.hasEntitlement(EntitlementName.PassBusiness) ||
                hasVPNPassProfessional(subscription);`,
            filename,
        },
        { code: `const canSeeVpnLogs = entitlements.hasVpnActivityMonitor && !!organization;`, filename },
        // Two checks, but in separate expressions
        {
            code: `const a = entitlements.hasVpn && isAdmin; const b = entitlements.hasLumo || loading;`,
            filename,
        },
    ],
    invalid: [
        {
            code: `const showVpnPanel = entitlements.isBusiness && entitlements.hasVpn;`,
            filename,
            errors: [
                { messageId: 'combinedEntitlementChecks', data: { count: 2 } },
                { messageId: 'combinedEntitlementChecks', data: { count: 2 } },
            ],
        },
        {
            // A negated check still counts as one of the two
            code: `const show = !r.hasEntitlement(a) && r.hasEntitlement(b);`,
            filename,
            errors: [{ messageId: 'combinedEntitlementChecks' }, { messageId: 'combinedEntitlementChecks' }],
        },
        {
            // Two checks inside a longer chain of plain conditions
            code: `const show = isAdmin || entitlements.hasVpn || loading || entitlements.hasLumo;`,
            filename,
            errors: [{ messageId: 'combinedEntitlementChecks' }, { messageId: 'combinedEntitlementChecks' }],
        },
        {
            code: `const show = r.hasMatchingSubscription({ includes: [a], excludes: [b] }) && r.quantityForMember(c) && isAdmin;`,
            filename,
            errors: [{ messageId: 'combinedEntitlementChecks' }, { messageId: 'combinedEntitlementChecks' }],
        },
    ],
});

ruleTester.run('no-boolean-entitlement-composition (outside the monorepo)', rule, {
    valid: [
        // Without the registry, named checks are indistinguishable from any other property
        { code: `const show = entitlements.isBusiness || entitlements.hasVpn;`, filename: '/tmp/file.ts' },
    ],
    invalid: [
        {
            // Resolver methods are recognised by name alone
            code: `const show = r.hasEntitlement(a) && r.quantityTotal(b) > 0 && r.hasEntitlement(c);`,
            filename: '/tmp/file.ts',
            errors: [{ messageId: 'combinedEntitlementChecks' }, { messageId: 'combinedEntitlementChecks' }],
        },
    ],
});

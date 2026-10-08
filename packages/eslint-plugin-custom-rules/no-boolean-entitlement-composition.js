/*

// ❌ Wrong - two entitlement checks combined by hand; the combination is the domain question and has no name
const showVpnPanel = entitlements.isBusiness && entitlements.hasVpn;

// ❌ Wrong - a negated check still counts as one of the two
const showUpsell = !entitlements.hasEntitlement(EntitlementName.Business) && entitlements.hasSentinel;

// ✅ Correct - the combination is named in the registry, and the call site reads as one question
// packages/payments/core/entitlements/checks.ts
isB2cMultiUser: (r) => r.hasMatchingSubscription({ includes: [EntitlementName.MultiUser], excludes: [EntitlementName.Business] })
// call site
const showFamilyUpsell = entitlements.isB2cMultiUser;

// ✅ Correct - inside the check registry itself, which is where a combination gets its name, so the whole
// file is skipped
// packages/payments/core/entitlements/checks.ts
isBusiness: (r) => r.hasEntitlement(EntitlementName.Business) && !r.hasEntitlement(EntitlementName.MultiUser)

// ✅ Correct - one entitlement check combined with conditions the registry cannot express (a plan helper,
// a feature flag, whether the organization is loaded)
const showFeaturesColumn =
    !hasExternalMemberCapableB2BPlan ||
    hasDriveB2BPlan ||
    entitlements.hasEntitlement(EntitlementName.PassBusiness) ||
    hasVPNPassProfessional(subscription);

// ✅ Correct - a single check may be negated: it is still one question, about one entitlement
const isPersonalAccount = !entitlements.hasEntitlement(EntitlementName.Business);
const hasPassBusiness = !!entitlements.quantityTotal(EntitlementName.PassBusiness);

// ✅ Correct - a comparison on a quantity is not a boolean composition of checks
const hasRoomForMoreMembers = entitlements.quantityTotal(EntitlementName.MaxMembers) > usedMembers;

*/
import {
    getRegisteredCheckNames,
    isEntitlementChecksRegistry,
    isEntitlementResolverCall,
} from './entitlement-checks-helpers.js';

const isEntitlementExpression = (node, registeredCheckNames) => {
    switch (node.type) {
        case 'ChainExpression':
        case 'TSNonNullExpression':
        case 'TSAsExpression':
            return isEntitlementExpression(node.expression, registeredCheckNames);
        case 'CallExpression':
            return isEntitlementResolverCall(node);
        case 'UnaryExpression':
            // A negated check is allowed on its own, but it is still an entitlement check when combined.
            return node.operator === '!' && isEntitlementExpression(node.argument, registeredCheckNames);
        case 'MemberExpression':
            if (!node.computed && node.property.type === 'Identifier' && registeredCheckNames.has(node.property.name)) {
                return true;
            }

            return isEntitlementExpression(node.object, registeredCheckNames);
        default:
            return false;
    }
};

const isLogicalChain = (node) =>
    node?.type === 'LogicalExpression' && (node.operator === '&&' || node.operator === '||');

const flattenOperands = (node) =>
    isLogicalChain(node) ? [...flattenOperands(node.left), ...flattenOperands(node.right)] : [node];

export default {
    meta: {
        docs: {
            description:
                'Forbid combining two or more entitlement checks with `&&` / `||`. A combination of entitlements is a domain statement and needs a name: register it in `entitlementChecksForSelection` (or `entitlementChecksForOrgAndUser`), so readers see what is being asked instead of decoding the expression. A single check is free to appear in any expression — negated, or next to conditions the registry cannot express such as plan helpers and feature flags.',
        },
        schema: [],
        messages: {
            combinedEntitlementChecks:
                'Do not combine {{count}} entitlement checks by hand. Register a named check in `entitlementChecksForSelection` (or `entitlementChecksForOrgAndUser`) whose name explains what the combination means.',
        },
    },
    create: (context) => {
        if (isEntitlementChecksRegistry(context)) {
            return {};
        }

        const registeredCheckNames = getRegisteredCheckNames(context);

        return {
            // Only the outermost expression of a `&&` / `||` chain, so that a chain is judged as a whole:
            // one entitlement check among plain conditions is fine, two of them need a name.
            LogicalExpression(node) {
                if (isLogicalChain(node.parent)) {
                    return;
                }

                const checks = flattenOperands(node).filter((operand) =>
                    isEntitlementExpression(operand, registeredCheckNames)
                );

                if (checks.length < 2) {
                    return;
                }

                for (const check of checks) {
                    context.report({
                        node: check,
                        messageId: 'combinedEntitlementChecks',
                        data: { count: checks.length },
                    });
                }
            },
        };
    },
};

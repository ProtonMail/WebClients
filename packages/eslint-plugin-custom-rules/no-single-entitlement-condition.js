/*

// ❌ Wrong - a single entitlement and no exclusions is the question hasEntitlement answers
isBusiness: (r) => r.hasMatchingSubscription({ includes: [EntitlementName.Business] })

// ❌ Wrong - an empty excludes list excludes nothing
isBusiness: (r) => r.hasMatchingSubscription({ includes: [EntitlementName.Business], excludes: [] })

// ❌ Wrong - hasEntitlement is the question being asked, and on the org/user resolver it also carries
// stronger guarantees
const showUpsell = entitlements.hasMatchingSubscription({ includes: [EntitlementName.Sentinel] });

// ❌ Wrong - findSubscriptionsMatching also returns the matching subscriptions, so the rewrite depends on
// whether the caller needs them
const { result } = entitlements.findSubscriptionsMatching({ includes: [EntitlementName.Business] });

// ✅ Correct
isBusiness: (r) => r.hasEntitlement(EntitlementName.Business)

// ✅ Correct - the exclusion carries meaning, so the condition cannot collapse into one name
isB2cMultiUser: (r) => r.hasMatchingSubscription({ includes: [EntitlementName.MultiUser], excludes: [EntitlementName.Business] })

// ✅ Correct - more than one entitlement
isMspEligible: (r) => r.hasMatchingSubscription({ includes: [EntitlementName.PassBusiness, EntitlementName.MaxSubsidiaries] })

// ✅ Correct - anything that is not an inline `{ includes: [...] }` condition is unknown at lint time
r.hasMatchingSubscription(conditions);
r.hasMatchingSubscription({ includes: names });
r.hasMatchingSubscription({ includes: [...names] });

*/
import { getEntitlementConditions } from './entitlement-checks-helpers.js';

const isEmpty = (arrayExpression) => !arrayExpression || arrayExpression.elements.length === 0;

const isSingleEntitlementCondition = (conditions) => {
    if (conditions.includes.elements.length !== 1) {
        return false;
    }

    const [entitlement] = conditions.includes.elements;

    if (!entitlement || entitlement.type === 'SpreadElement') {
        return false;
    }

    if (conditions.excludes && conditions.excludes.type !== 'ArrayExpression') {
        return false;
    }

    return isEmpty(conditions.excludes);
};

export default {
    meta: {
        docs: {
            description:
                'Forbid asking a single-entitlement question through `hasMatchingSubscription` / `findSubscriptionsMatching`. A condition with one entitlement and no exclusions is what `hasEntitlement` is for: it states the intent, and on the org/user resolver it carries the stronger guarantees. Reported without a fixer on purpose: on the org/user resolver the two methods read different sources — `hasMatchingSubscription` folds the catalog over the subscriptions while `hasEntitlement` reads the backend-granted quantity, and `parity.test.ts` pins that they can disagree in both directions. Rewriting is a judgement about which source the call site wants, so it stays with the author.',
        },
        schema: [],
        messages: {
            singleEntitlementCondition:
                'A condition with a single entitlement and no exclusions should use `hasEntitlement(name)` instead of `{{method}}({ includes: [name] })`.',
        },
    },
    create: (context) => {
        return {
            CallExpression(node) {
                const conditions = getEntitlementConditions(node);

                if (!conditions) {
                    return;
                }

                if (!isSingleEntitlementCondition(conditions)) {
                    return;
                }

                const { callee } = node;
                const method = callee.type === 'MemberExpression' ? callee.property.name : callee.name;

                context.report({
                    node,
                    messageId: 'singleEntitlementCondition',
                    data: { method },
                });
            },
        };
    },
};

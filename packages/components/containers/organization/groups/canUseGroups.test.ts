import { PLANS } from '@proton/payments/core/constants';

import canUseGroups from './canUseGroups';

describe('canUseGroups', () => {
    describe('plan and options combinations', () => {
        const dataSet = [
            // without the groups entitlement the feature is never available
            {
                plan: PLANS.MAIL_BUSINESS,
                orgHasGroupsEntitlement: false,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: false,
            },
            {
                plan: PLANS.MAIL_BUSINESS,
                orgHasGroupsEntitlement: false,
                isUserGroupsNoCustomDomainEnabled: true,
                expected: false,
            },
            {
                plan: PLANS.FREE,
                orgHasGroupsEntitlement: false,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: false,
            },
            {
                plan: PLANS.PASS_PRO,
                orgHasGroupsEntitlement: false,
                isUserGroupsNoCustomDomainEnabled: true,
                expected: false,
            },
            // with the entitlement, non-VPN plans can always use groups
            {
                plan: PLANS.MAIL_BUSINESS,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: true,
            },
            {
                plan: PLANS.MAIL_BUSINESS,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: true,
                expected: true,
            },
            {
                plan: PLANS.PASS_BUSINESS,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: true,
            },
            // plans that only gained access to the page through the entitlement
            {
                plan: PLANS.LUMO_BUSINESS,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: true,
            },
            {
                plan: PLANS.MEET_BUSINESS,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: true,
            },
            // VPN plans stay behind the feature flag even once entitled
            {
                plan: PLANS.VPN_BUSINESS,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: false,
            },
            {
                plan: PLANS.VPN_BUSINESS,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: true,
                expected: true,
            },
            {
                plan: PLANS.VPN_PRO,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: false,
            },
            {
                plan: PLANS.VPN_PASS_BUNDLE_BUSINESS,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: false,
            },
            // an unknown plan is not treated as a VPN plan, the entitlement decides
            {
                plan: undefined,
                orgHasGroupsEntitlement: true,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: true,
            },
            {
                plan: undefined,
                orgHasGroupsEntitlement: false,
                isUserGroupsNoCustomDomainEnabled: false,
                expected: false,
            },
        ];

        it.each(dataSet)(
            'returns $expected for plan=$plan, orgHasGroupsEntitlement=$orgHasGroupsEntitlement, isUserGroupsNoCustomDomainEnabled=$isUserGroupsNoCustomDomainEnabled',
            ({ plan, orgHasGroupsEntitlement, isUserGroupsNoCustomDomainEnabled, expected }) => {
                const result = canUseGroups(plan, {
                    orgHasGroupsEntitlement,
                    isUserGroupsNoCustomDomainEnabled,
                });

                expect(result).toBe(expected);
            }
        );
    });
});

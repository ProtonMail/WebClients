import { PLANS } from '@proton/payments';

import canUseGroups from './canUseGroups';

describe('canUseGroups', () => {
    describe('plan and options combinations', () => {
        const dataSet = [
            // if plan is MAIL Pro/Biz canUseGroups always is true
            {
                plan: PLANS.MAIL_BUSINESS,
                isUserGroupsNoCustomDomainEnabled: false,
                hasGroups: false,
                expected: true,
            },
            {
                plan: PLANS.MAIL_BUSINESS,
                isUserGroupsNoCustomDomainEnabled: false,
                hasGroups: true,
                expected: true,
            },
            {
                plan: PLANS.MAIL_BUSINESS,
                isUserGroupsNoCustomDomainEnabled: true,
                hasGroups: false,
                expected: true,
            },
            {
                plan: PLANS.MAIL_BUSINESS,
                isUserGroupsNoCustomDomainEnabled: true,
                hasGroups: true,
                expected: true,
            },
            // if plan Vpn Biz/Pro canUseGroups is true if the feature flag is enabled
            {
                plan: PLANS.VPN_BUSINESS,
                isUserGroupsNoCustomDomainEnabled: false,
                hasGroups: false,
                expected: false,
            },
            {
                plan: PLANS.VPN_BUSINESS,
                isUserGroupsNoCustomDomainEnabled: false,
                hasGroups: true,
                expected: false,
            },
            {
                plan: PLANS.VPN_BUSINESS,
                isUserGroupsNoCustomDomainEnabled: true,
                hasGroups: false,
                expected: true,
            },
            {
                plan: PLANS.VPN_BUSINESS,
                isUserGroupsNoCustomDomainEnabled: true,
                hasGroups: true,
                expected: true,
            },
            // if plan is valid always return false
            {
                plan: PLANS.FREE,
                isUserGroupsNoCustomDomainEnabled: false,
                hasGroups: false,
                expected: false,
            },
            {
                plan: PLANS.PASS_PRO,
                isUserGroupsNoCustomDomainEnabled: true,
                hasGroups: false,
                expected: false,
            },
        ];

        it.each(dataSet)(
            'returns $expected for plan=$plan, isUserGroupsNoCustomDomainEnabled=$isUserGroupsNoCustomDomainEnabled, hasGroups=$hasGroups',
            ({ plan, isUserGroupsNoCustomDomainEnabled, hasGroups, expected }) => {
                const result = canUseGroups(plan, {
                    isUserGroupsNoCustomDomainEnabled,
                    hasGroups,
                });

                expect(result).toBe(expected);
            }
        );
    });
});

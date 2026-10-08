import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { EntitlementScope, EntitlementType } from '@proton/payments/core/entitlements/interface';
import { createEntitlementResolver } from '@proton/payments/core/entitlements/resolver';
import { makeEntitlements } from '@proton/payments/testing/makeEntitlements';

import { ADMIN_CONSOLE_SURVEY_MIN_USERS, getIsAdminConsoleSurveyEligible } from './adminConsoleSurveyEligibility';

const createEntitlements = (names: EntitlementName[]) =>
    createEntitlementResolver(
        makeEntitlements(
            names.map((Name) => ({
                Name,
                Quantity: 1,
                Type: EntitlementType.Switch,
                Scope: EntitlementScope.Global,
            }))
        )
    );

const eligibleParams = {
    entitlements: createEntitlements([EntitlementName.Business, EntitlementName.FlagsVpn]),
    usedMembers: ADMIN_CONSOLE_SURVEY_MIN_USERS + 1,
    localeCode: 'en_US',
};

describe('getIsAdminConsoleSurveyEligible', () => {
    it('is eligible when every rule passes', () => {
        expect(getIsAdminConsoleSurveyEligible(eligibleParams)).toBe(true);
    });

    describe('plan', () => {
        it('accepts a business org with a VPN entitlement', () => {
            const entitlements = createEntitlements([EntitlementName.Business, EntitlementName.FlagsVpn]);
            expect(getIsAdminConsoleSurveyEligible({ ...eligibleParams, entitlements })).toBe(true);
        });

        it('accepts a business org with a Pass entitlement', () => {
            const entitlements = createEntitlements([EntitlementName.Business, EntitlementName.FlagsPass]);
            expect(getIsAdminConsoleSurveyEligible({ ...eligibleParams, entitlements })).toBe(true);
        });

        it('rejects a business org with neither VPN nor Pass', () => {
            const entitlements = createEntitlements([EntitlementName.Business, EntitlementName.FlagsInbox]);
            expect(getIsAdminConsoleSurveyEligible({ ...eligibleParams, entitlements })).toBe(false);
        });

        it('rejects a non-business org even with VPN and Pass', () => {
            const entitlements = createEntitlements([EntitlementName.FlagsVpn, EntitlementName.FlagsPass]);
            expect(getIsAdminConsoleSurveyEligible({ ...eligibleParams, entitlements })).toBe(false);
        });
    });

    describe('organization size', () => {
        it('rejects an org with exactly the minimum number of users', () => {
            expect(
                getIsAdminConsoleSurveyEligible({ ...eligibleParams, usedMembers: ADMIN_CONSOLE_SURVEY_MIN_USERS })
            ).toBe(false);
        });

        it('accepts an org with one more user than the minimum', () => {
            expect(
                getIsAdminConsoleSurveyEligible({ ...eligibleParams, usedMembers: ADMIN_CONSOLE_SURVEY_MIN_USERS + 1 })
            ).toBe(true);
        });
    });

    describe('UI language', () => {
        it.each(['en_US', 'en_GB', 'de_DE', 'de_CH'])('accepts %s', (localeCode) => {
            expect(getIsAdminConsoleSurveyEligible({ ...eligibleParams, localeCode })).toBe(true);
        });

        it.each(['fr_FR', 'es_ES', 'ja_JP'])('rejects %s', (localeCode) => {
            expect(getIsAdminConsoleSurveyEligible({ ...eligibleParams, localeCode })).toBe(false);
        });
    });
});

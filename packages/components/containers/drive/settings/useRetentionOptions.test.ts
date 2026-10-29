import { renderHook } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import type { RevisionRetentionDaysSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import { buildUser } from '@proton/shared/testing/buildUser';

import { useRetentionOptions } from './useRetentionOptions';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
}));

const renderRetentionOptions = ({
    hasPaidDrive = true,
    subscriptionPlans,
    isOrganizationMember = false,
    loadingEntitlements = false,
    entitlements = buildOrgAndUserEntitlementChecks({
        subscriptionPlans,
        ...(isOrganizationMember ? organizationMember : {}),
    }),
    revisionRetentionDays,
}: {
    hasPaidDrive?: boolean;
    subscriptionPlans: CataloguedPlan[];
    isOrganizationMember?: boolean;
    loadingEntitlements?: boolean;
    entitlements?: ReturnType<typeof buildOrgAndUserEntitlementChecks>;
    revisionRetentionDays: RevisionRetentionDaysSetting;
}) => {
    jest.mocked(useUser).mockReturnValue([buildUser({ hasPaidDrive }), false]);
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([entitlements, loadingEntitlements]);

    const { options, canUpsellFree, canContactSalesForLongerHistory } = renderHook(() =>
        useRetentionOptions(revisionRetentionDays)
    ).result.current;

    return {
        disabled: options.filter((option) => option.disabled).map((option) => option.value),
        upsell: options.filter((option) => option.isUpsell).map((option) => option.value),
        canUpsellFree,
        canContactSalesForLongerHistory,
    };
};

describe('useRetentionOptions', () => {
    it('offers only the current value to a free user and upsells every other option', () => {
        expect(
            renderRetentionOptions({ hasPaidDrive: false, subscriptionPlans: [], revisionRetentionDays: 7 })
        ).toEqual({
            disabled: [0, 30, 180, 365, 3650],
            upsell: [0, 30, 180, 365, 3650],
            canUpsellFree: true,
            canContactSalesForLongerHistory: false,
        });
    });

    it.each([
        PLANS.DRIVE,
        PLANS.BUNDLE,
        PLANS.FAMILY,
        PLANS.DRIVE_PRO,
        PLANS.BUNDLE_PRO_2024,
        PLANS.BUNDLE_BIZ_2025,
    ] as const)('enables every option for %s', (plan) => {
        expect(renderRetentionOptions({ subscriptionPlans: [plan], revisionRetentionDays: 30 })).toEqual({
            disabled: [],
            upsell: [],
            canUpsellFree: false,
            canContactSalesForLongerHistory: false,
        });
    });

    it('disables and upsells 10 years for a drivebiz2024 admin', () => {
        expect(
            renderRetentionOptions({ subscriptionPlans: [PLANS.DRIVE_BUSINESS], revisionRetentionDays: 365 })
        ).toEqual({
            disabled: [3650],
            upsell: [3650],
            canUpsellFree: false,
            canContactSalesForLongerHistory: true,
        });
    });

    it('disables and upsells 10 years for a drivebiz2024 member, who cannot read the subscriptions', () => {
        expect(
            renderRetentionOptions({
                subscriptionPlans: [PLANS.DRIVE_BUSINESS],
                isOrganizationMember: true,
                revisionRetentionDays: 365,
            })
        ).toEqual({
            disabled: [3650],
            upsell: [3650],
            canUpsellFree: false,
            canContactSalesForLongerHistory: true,
        });
    });

    it('disables every option above 7 days without an upsell for drivelite2024', () => {
        expect(renderRetentionOptions({ subscriptionPlans: [PLANS.DRIVE_LITE], revisionRetentionDays: 7 })).toEqual({
            disabled: [30, 180, 365, 3650],
            upsell: [],
            canUpsellFree: false,
            canContactSalesForLongerHistory: false,
        });
    });

    it('disables every option above 7 days without an upsell when Mail Professional sits next to drivelite2024', () => {
        expect(
            renderRetentionOptions({ subscriptionPlans: [PLANS.MAIL_PRO, PLANS.DRIVE_LITE], revisionRetentionDays: 7 })
        ).toEqual({
            disabled: [30, 180, 365, 3650],
            upsell: [],
            canUpsellFree: false,
            canContactSalesForLongerHistory: false,
        });
    });

    it('enables every option without an upsell when drive2022 sits next to drivebiz2024', () => {
        expect(
            renderRetentionOptions({
                subscriptionPlans: [PLANS.DRIVE_BUSINESS, PLANS.DRIVE],
                revisionRetentionDays: 365,
            })
        ).toEqual({
            disabled: [],
            upsell: [],
            canUpsellFree: false,
            canContactSalesForLongerHistory: false,
        });
    });

    it('disables every option without an upsell while entitlements load', () => {
        expect(
            renderRetentionOptions({
                subscriptionPlans: [PLANS.DRIVE_BUSINESS],
                loadingEntitlements: true,
                revisionRetentionDays: 365,
            })
        ).toEqual({
            disabled: [0, 7, 30, 180, 365, 3650],
            upsell: [],
            canUpsellFree: false,
            canContactSalesForLongerHistory: false,
        });
    });

    it('enables every option for a paid user when the revision limit is unknown, for example after a failed request', () => {
        expect(
            renderRetentionOptions({
                subscriptionPlans: [],
                entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: [] }),
                revisionRetentionDays: 30,
            })
        ).toEqual({
            disabled: [],
            upsell: [],
            canUpsellFree: false,
            canContactSalesForLongerHistory: false,
        });
    });
});

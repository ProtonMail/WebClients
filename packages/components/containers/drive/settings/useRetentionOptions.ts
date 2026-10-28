import { useMemo } from 'react';

import { c } from 'ttag';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { RevisionRetentionDaysSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { getRetentionLabel } from './retentionLabels';

type RevisionRetentionOption = {
    value: RevisionRetentionDaysSetting;
    label: string;
    disabled: boolean;
    isUpsell: boolean;
};

const LONGEST_RETENTION_DAYS = 3650;

export const useRetentionOptions = (revisionRetentionDays?: RevisionRetentionDaysSetting) => {
    const [{ hasPaidDrive }] = useUser();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();

    const revisionDaysLimit = entitlements.hasEntitlement(EntitlementName.MaxRevisionDays)
        ? entitlements.quantityTotal(EntitlementName.MaxRevisionDays)
        : undefined;
    const isCappedBelowLongestRetention = revisionDaysLimit !== undefined && revisionDaysLimit < LONGEST_RETENTION_DAYS;
    const canUpsellFree = !hasPaidDrive;
    const canContactSalesForLongerHistory =
        !loadingEntitlements && isCappedBelowLongestRetention && entitlements.isDriveB2B;

    const options: RevisionRetentionOption[] = useMemo(
        () =>
            (
                [
                    { value: 0, label: c('Label').t`Don't keep versions` },
                    { value: 7, label: getRetentionLabel(7) },
                    { value: 30, label: getRetentionLabel(30) },
                    { value: 180, label: getRetentionLabel(180) },
                    { value: 365, label: getRetentionLabel(365) },
                    { value: LONGEST_RETENTION_DAYS, label: getRetentionLabel(LONGEST_RETENTION_DAYS) },
                ] satisfies Omit<RevisionRetentionOption, 'disabled' | 'isUpsell'>[]
            ).map((option) => {
                const isAboveLimit = revisionDaysLimit !== undefined && option.value > revisionDaysLimit;
                const isFreeUpsell = canUpsellFree && option.value !== revisionRetentionDays;
                const isUpsell =
                    !loadingEntitlements && (isFreeUpsell || (canContactSalesForLongerHistory && isAboveLimit));
                const disabled = loadingEntitlements || isUpsell || (hasPaidDrive && isAboveLimit);

                return { ...option, disabled, isUpsell };
            }),
        [
            canUpsellFree,
            canContactSalesForLongerHistory,
            hasPaidDrive,
            loadingEntitlements,
            revisionDaysLimit,
            revisionRetentionDays,
        ]
    );

    return {
        options,
        canUpsellFree,
        canContactSalesForLongerHistory,
    };
};

import { useMemo } from 'react';

import { c } from 'ttag';

import type { RevisionRetentionDaysSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useDrivePlan } from '../../../hooks/drive';
import { getRetentionLabel } from './retentionLabels';

type RevisionRetentionOption = {
    value: RevisionRetentionDaysSetting;
    label: string;
    disabled: boolean;
    isUpsell: boolean;
};

export const useRetentionOptions = (revisionRetentionDays?: RevisionRetentionDaysSetting) => {
    const { canUpsellFree, canUpsellB2B, isDriveLite } = useDrivePlan();

    const options: RevisionRetentionOption[] = useMemo(
        () =>
            (
                [
                    { value: 0, label: c('Label').t`Don't keep versions` },
                    { value: 7, label: getRetentionLabel(7) },
                    { value: 30, label: getRetentionLabel(30) },
                    { value: 180, label: getRetentionLabel(180) },
                    { value: 365, label: getRetentionLabel(365) },
                    { value: 3650, label: getRetentionLabel(3650) },
                ] satisfies Omit<RevisionRetentionOption, 'disabled' | 'isUpsell'>[]
            ).map((option) => {
                const isUpsell =
                    // Free user: revisionRetentionDays will be the default and only available value
                    (canUpsellFree && option.value !== revisionRetentionDays) ||
                    // Business user: 10 years option is disabled
                    (canUpsellB2B && option.value === 3650);

                const disabled =
                    // Upsell is *always* disabled
                    isUpsell ||
                    // Drive Lite: cannot upsell, max 7 days, can disable
                    (isDriveLite && option.value !== revisionRetentionDays && option.value !== 0);

                return { ...option, disabled, isUpsell };
            }),
        [canUpsellFree, canUpsellB2B, revisionRetentionDays]
    );

    return {
        options,
        canUpsellFree,
        canUpsellB2B,
    };
};

import { useMemo } from 'react';

import { c } from 'ttag';

import {
    type RecoveryCondition,
    type RecoveryIndicator,
    type RecoveryIndicatorKind,
    type RecoverySurface,
    getRecoveryIndicators,
    selectRecoveryConditions,
} from '@proton/account/recovery/recoveryConditions';
import { ThemeColor } from '@proton/colors/types';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import useSecurityCenter from '../components/drawer/views/SecurityCenter/useSecurityCenter';
import type { SettingsNotification } from '../containers/layout/interface';

interface RecoveryIndicatorDisplay extends RecoveryIndicator {
    color: ThemeColor;
    text: string;
    /** Link from outside the recovery page, such as quick settings */
    path: string;
    /** Why recovery needs attention, in one sentence: the sidebar indicator's tooltip */
    tooltip: string;
}

const kindColors: Record<RecoveryIndicatorKind, ThemeColor> = {
    danger: ThemeColor.Danger,
    warning: ThemeColor.Warning,
};

const getConditionDisplay = (
    condition: RecoveryCondition
): Pick<RecoveryIndicatorDisplay, 'text' | 'path' | 'tooltip'> => {
    switch (condition) {
        case 'outdated-phrase':
            return {
                path: '/recovery#data',
                text: c('Action').t`Update recovery phrase`,
                tooltip: c('Tooltip')
                    .t`Your recovery phrase is out of date. Get a new one so you can still recover your data.`,
            };
        case 'outdated-file':
            return {
                path: '/recovery#data',
                text: c('Action').t`Update recovery file`,
                tooltip: c('Tooltip')
                    .t`Your recovery file is out of date. Download a new one so you can still recover your data.`,
            };
        case 'locked-data':
            return {
                path: '/recovery?action=recover-data',
                text: c('Action').t`Unlock data`,
                tooltip: c('Tooltip').t`Some of your data is locked. Use a recovery method to unlock it.`,
            };
        case 'sentinel-phrase-missing':
            return {
                path: '/recovery#data',
                // Same wording as main for Sentinel users
                text: c('Action').t`Update recovery phrase`,
                tooltip: c('Tooltip').t`Generate a recovery phrase to protect your account against data loss.`,
            };
        case 'phrase-not-set':
            return {
                path: '/recovery?action=generate-recovery-phrase',
                text: c('Action').t`Set recovery phrase`,
                tooltip: c('Tooltip')
                    .t`Create a recovery phrase so you can recover your data if you forget your password.`,
            };
        case 'account-recovery-missing':
            return {
                path: '/recovery',
                text: c('Action').t`Activate recovery`,
                tooltip: c('Tooltip').t`Add a recovery email or phone so you can reset your password if you forget it.`,
            };
        case 'data-recovery-missing':
            return {
                path: '/recovery',
                text: c('Action').t`Activate recovery`,
                tooltip: c('Tooltip').t`Add a data recovery method to unlock your data if you forget your password.`,
            };
    }
};

/** The recovery indicators the given surface shows, most important first */
const useRecoveryIndicators = (surface: RecoverySurface): RecoveryIndicatorDisplay[] => {
    // Loads the flag that selectRecoveryConditions reads
    useFeature(FeatureCode.DismissedRecoverDataCard);
    const hasSecurityCenter = useSecurityCenter();
    const conditions = useSelector(selectRecoveryConditions);

    return useMemo(
        () =>
            getRecoveryIndicators(conditions, surface, { hasSecurityCenter }).map((indicator) => ({
                ...indicator,
                ...getConditionDisplay(indicator.condition),
                color: kindColors[indicator.kind],
            })),
        [conditions, surface, hasSecurityCenter]
    );
};

/** The surface's most important recovery indicator, for a single dot */
export const useRecoveryIndicator = (surface: RecoverySurface): RecoveryIndicatorDisplay | undefined => {
    return useRecoveryIndicators(surface)[0];
};

/** The settings sidebar's "Recovery" indicator: the most important indicator's colour, explained in its tooltip */
export const useRecoverySidebarNotification = (): SettingsNotification | undefined => {
    const indicator = useRecoveryIndicator('settingsSidebar');
    return useMemo(() => indicator && { color: indicator.color, label: indicator.tooltip }, [indicator]);
};

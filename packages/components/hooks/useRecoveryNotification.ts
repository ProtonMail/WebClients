import { c } from 'ttag';

import { selectRecoveryNotification } from '@proton/account/recovery/recoveryNotification';
import { ThemeColor } from '@proton/colors';
import { FeatureCode, useFeature } from '@proton/features';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import useSecurityCenter from '../components/drawer/views/SecurityCenter/useSecurityCenter';

const useRecoveryNotification = (
    isLessInvasive: boolean,
    isQuickSettings?: boolean
): { path: string; text: string; color: ThemeColor } | undefined => {
    const isSecurityCenterEnabled = useSecurityCenter();
    const alreadyDisplayedInSecurityCenter = isSecurityCenterEnabled && isQuickSettings;

    const { loading, overallStatus, mnemonicData, recoveryFileData, sentinelData, dataRecovery, hasKeysToReactivate } =
        useSelector(selectRecoveryNotification);

    const { feature: hasDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);

    if (loading) {
        return;
    }

    if (!dataRecovery.isDataRecoveryAvailable) {
        return;
    }

    if (mnemonicData.isMnemonicAvailable && mnemonicData.hasOutdatedMnemonic) {
        return {
            path: '/recovery#data',
            text: c('Action').t`Update recovery phrase`,
            color: ThemeColor.Danger,
        };
    }

    if (
        recoveryFileData.isRecoveryFileAvailable &&
        recoveryFileData.hasOutdatedRecoveryFile &&
        !alreadyDisplayedInSecurityCenter
    ) {
        return {
            path: '/recovery#data',
            text: c('Action').t`Update recovery file`,
            color: ThemeColor.Danger,
        };
    }

    if (isLessInvasive) {
        return;
    }

    if (hasKeysToReactivate && hasDismissedRecoverDataCard?.Value === false) {
        return {
            path: '/recovery?action=recover-data',
            text: c('Action').t`Unlock data`,
            color: ThemeColor.Danger,
        };
    }
    // keeps account recovery notification dot consistent with mail security center for new recovery settings for sentinel users
    if (sentinelData.isSentinelUser && !alreadyDisplayedInSecurityCenter) {
        if (mnemonicData.isMnemonicAvailable && !mnemonicData.isMnemonicSet) {
            return {
                path: '/recovery#data',
                text: c('Action').t`Update recovery phrase`,
                color: ThemeColor.Danger,
            };
        }
        return;
    }

    if (mnemonicData.isMnemonicSet || overallStatus === 'complete') {
        return;
    }

    if (mnemonicData.isMnemonicAvailable && mnemonicData.mnemonicCanBeSet && !alreadyDisplayedInSecurityCenter) {
        return {
            path: '/recovery?action=generate-recovery-phrase',
            text: c('Action').t`Set recovery phrase`,
            color: ThemeColor.Warning,
        };
    }

    if (!alreadyDisplayedInSecurityCenter) {
        return {
            path: '/recovery',
            text: c('Action').t`Activate recovery`,
            color: ThemeColor.Warning,
        };
    }
};

export default useRecoveryNotification;

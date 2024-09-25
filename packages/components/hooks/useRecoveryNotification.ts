import { c } from 'ttag';

import { ThemeColor } from '@proton/colors';
import { FeatureCode, useFeature } from '@proton/features';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { getLikelyHasKeysToReactivate } from '@proton/shared/lib/keys/getInactiveKeys';

import useSecurityCenter from '../components/drawer/views/SecurityCenter/useSecurityCenter';
import { getOverallStatus } from '../containers/recovery/getOverallStatus';
import { useIsRecoveryFileAvailable } from './recoveryFile';
import useAddresses from './useAddresses';
import useHasOutdatedRecoveryFile from './useHasOutdatedRecoveryFile';
import useIsDataRecoveryAvailable from './useIsDataRecoveryAvailable';
import useIsMnemonicAvailable from './useIsMnemonicAvailable';
import useIsSentinelUser from './useIsSentinelUser';
import useRecoveryStatus from './useRecoveryStatus';
import useUser from './useUser';

const useRecoveryNotification = (
    isLessInvasive: boolean,
    isQuickSettings?: boolean,
    canDisplayNewSentinelSettings?: boolean
): { path: string; text: string; color: ThemeColor } | undefined => {
    const [user] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const isSecurityCenterEnabled = useSecurityCenter();
    const alreadyDisplayedInSecurityCenter = isSecurityCenterEnabled && isQuickSettings;

    const [{ accountRecoveryStatus, dataRecoveryStatus, mnemonicIsSet }, loadingRecoveryStatus] = useRecoveryStatus();

    const [isRecoveryFileAvailable, loadingIsRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();
    const [isDataRecoveryAvailable, loadingIsDataRecoveryAvailable] = useIsDataRecoveryAvailable();
    const hasOutdatedRecoveryFile = useHasOutdatedRecoveryFile();
    const [{ isSentinelUser, hasMnemonic }, loadingIsSentinelUser] = useIsSentinelUser();

    const { feature: hasDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);
    const hasKeysToReactivate = getLikelyHasKeysToReactivate(user, addresses);

    const overallStatus = getOverallStatus({ accountRecoveryStatus, dataRecoveryStatus, isDataRecoveryAvailable });

    const loading =
        loadingRecoveryStatus ||
        loadingIsRecoveryFileAvailable ||
        loadingIsMnemonicAvailable ||
        loadingIsDataRecoveryAvailable ||
        loadingIsSentinelUser ||
        loadingAddresses;
    if (loading) {
        return;
    }

    if (!isDataRecoveryAvailable) {
        return;
    }

    const hasOutdatedMnemonic = user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED;
    if (isMnemonicAvailable && hasOutdatedMnemonic) {
        return {
            path: '/recovery#data',
            text: c('Action').t`Update recovery phrase`,
            color: ThemeColor.Danger,
        };
    }

    if (isRecoveryFileAvailable && hasOutdatedRecoveryFile && !alreadyDisplayedInSecurityCenter) {
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
    if (isSentinelUser && canDisplayNewSentinelSettings && !alreadyDisplayedInSecurityCenter) {
        if (!hasMnemonic) {
            return {
                path: '/recovery#data',
                text: c('Action').t`Update recovery phrase`,
                color: ThemeColor.Danger,
            };
        }
        return;
    }

    if (mnemonicIsSet || overallStatus === 'complete') {
        return;
    }

    const mnemonicCanBeSet =
        user.MnemonicStatus === MNEMONIC_STATUS.ENABLED || user.MnemonicStatus === MNEMONIC_STATUS.PROMPT;
    if (isMnemonicAvailable && mnemonicCanBeSet && !alreadyDisplayedInSecurityCenter) {
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

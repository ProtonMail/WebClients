import { c } from 'ttag';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

import getOverallStatus from '../containers/recovery/getOverallStatus';
import { FeatureCode } from '../containers/features/FeaturesContext';
import { NotificationDotColor } from '../components/notificationDot/NotificationDot';
import getLikelyHasKeysToReactivate from '../containers/keys/reactivateKeys/getLikelyHasKeysToReactivate';

import useRecoveryStatus from './useRecoveryStatus';
import useIsDataRecoveryAvailable from './useIsDataRecoveryAvailable';
import useUser from './useUser';
import useAddresses from './useAddresses';
import useFeature from './useFeature';
import useIsRecoveryFileAvailable from './useIsRecoveryFileAvailable';
import useIsMnemonicAvailable from './useIsMnemonicAvailable';
import useHasOutdatedRecoveryFile from './useHasOutdatedRecoveryFile';

const useRecoveryNotification = (
    isLessInvasive: boolean
): { path: string; text: string; color: NotificationDotColor } | undefined => {
    const { feature: hasVisitedRecoveryPage } = useFeature(FeatureCode.VisitedRecoveryPage);
    const [user] = useUser();
    const [addresses, loadingAddresses] = useAddresses();

    const [{ accountRecoveryStatus, dataRecoveryStatus, mnemonicIsSet }, loadingRecoveryStatus] = useRecoveryStatus();

    const [isRecoveryFileAvailable, loadingIsRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();
    const [isDataRecoveryAvailable, loadingIsDataRecoveryAvailable] = useIsDataRecoveryAvailable();
    const hasOutdatedRecoveryFile = useHasOutdatedRecoveryFile();
    const hasKeysToReactivate = getLikelyHasKeysToReactivate(user, addresses);

    const overallStatus = getOverallStatus({ accountRecoveryStatus, dataRecoveryStatus, isDataRecoveryAvailable });

    const loading =
        loadingRecoveryStatus ||
        loadingIsRecoveryFileAvailable ||
        loadingIsMnemonicAvailable ||
        loadingIsDataRecoveryAvailable ||
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
            color: 'danger',
        };
    }

    if (isRecoveryFileAvailable && hasOutdatedRecoveryFile) {
        return {
            path: '/recovery#data',
            text: c('Action').t`Update recovery file`,
            color: 'danger',
        };
    }

    if (isLessInvasive && hasVisitedRecoveryPage?.Value !== false) {
        return;
    }

    if (hasKeysToReactivate) {
        return {
            path: '/recovery?action=recover-data',
            text: c('Action').t`Unlock data`,
            color: 'danger',
        };
    }

    if (mnemonicIsSet || overallStatus === 'complete') {
        return;
    }

    const mnemonicCanBeSet =
        user.MnemonicStatus === MNEMONIC_STATUS.ENABLED || user.MnemonicStatus === MNEMONIC_STATUS.PROMPT;
    if (isMnemonicAvailable && mnemonicCanBeSet) {
        return {
            path: '/recovery?action=generate-recovery-phrase',
            text: c('Action').t`Set recovery phrase`,
            color: 'warning',
        };
    }

    return {
        path: '/recovery',
        text: c('Action').t`Activate recovery`,
        color: 'warning',
    };
};

export default useRecoveryNotification;

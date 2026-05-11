import { c } from 'ttag';

import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcRecoveryFile } from '@proton/icons/icons/IcRecoveryFile';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

interface Props {
    to: string;
}

const RecoveryFileBadge = () => {
    const { hasOutdatedRecoveryFile, hasCurrentRecoveryFile, isRecoveryFileAvailable, recoverySecrets, loading } =
        useSelector(selectRecoveryFileData);
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loading || loadingIsSentinelUser) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    const isRecoveryFileSentinelConflict =
        isRecoveryFileAvailable && !hasOutdatedRecoveryFile && recoverySecrets.length > 0;

    if (isSentinelUser && isRecoveryFileSentinelConflict) {
        return (
            <StatusBadge
                status={StatusBadgeStatus.Warning}
                text={c('Status').t`Disable recovery file`}
                icon={IcShieldExclamationFilled}
            />
        );
    }

    if (isSentinelUser) {
        return <StatusBadge status={StatusBadgeStatus.Off} text={c('Status').t`Off`} />;
    }

    if (hasOutdatedRecoveryFile) {
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Outdated`} />;
    }
    if (hasCurrentRecoveryFile) {
        return <StatusBadge status={StatusBadgeStatus.On} text={c('Status').t`Saved`} />;
    }
    return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Not saved`} />;
};

const RecoveryFile = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcRecoveryFile}
            title={c('Title').t`Recovery file`}
            tooltip={c('Tooltip').t`Save an encryption backup file to recover your data after a password reset`}
        >
            <RecoveryFileBadge />
        </SettingsNavItem>
    );
};

export default RecoveryFile;

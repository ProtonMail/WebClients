import { c } from 'ttag';

import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import useHasOutdatedRecoveryFile from '@proton/components/hooks/useHasOutdatedRecoveryFile';
import useRecoverySecrets from '@proton/components/hooks/useRecoverySecrets';
import { IcCode } from '@proton/icons/icons/IcCode';

interface Props {
    to: string;
}

const RecoveryFileBadge = () => {
    const hasOutdatedRecoveryFile = useHasOutdatedRecoveryFile();
    const recoverySecrets = useRecoverySecrets();
    const hasRecoveryFile = recoverySecrets.length > 0;

    if (hasOutdatedRecoveryFile) {
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Outdated`} />;
    }
    if (hasRecoveryFile) {
        return <StatusBadge status={StatusBadgeStatus.On} text={c('Status').t`Saved`} />;
    }
    return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Not saved`} />;
};

const RecoveryFile = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcCode}
            title={c('Title').t`Recovery file`}
            tooltip={c('Tooltip').t`Save an encryption backup file to recover your data after a password reset`}
        >
            <RecoveryFileBadge />
        </SettingsNavItem>
    );
};

export default RecoveryFile;

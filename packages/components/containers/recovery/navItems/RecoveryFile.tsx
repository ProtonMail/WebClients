import { c } from 'ttag';

import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcCode } from '@proton/icons/icons/IcCode';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

interface Props {
    to: string;
}

const RecoveryFileBadge = () => {
    const { hasOutdatedRecoveryFile, hasCurrentRecoveryFile } = useSelector(selectRecoveryFileData);

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
            icon={IcCode}
            title={c('Title').t`Recovery file`}
            tooltip={c('Tooltip').t`Save an encryption backup file to recover your data after a password reset`}
        >
            <RecoveryFileBadge />
        </SettingsNavItem>
    );
};

export default RecoveryFile;

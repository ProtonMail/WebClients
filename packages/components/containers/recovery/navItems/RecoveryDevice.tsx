import { c } from 'ttag';

import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcDesktop } from '@proton/icons/icons/IcDesktop';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

const RecoveryDeviceBadge = ({ recoveryFileData }: { recoveryFileData: ReturnType<typeof selectRecoveryFileData> }) => {
    const { hasDeviceRecoveryEnabled, loading } = recoveryFileData;
    if (loading) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }
    if (hasDeviceRecoveryEnabled) {
        return <StatusBadge status={StatusBadgeStatus.On} text={c('Status').t`On`} />;
    }
    return <StatusBadge status={StatusBadgeStatus.Off} text={c('Status').t`Off`} />;
};

interface Props {
    to: string;
}
const RecoveryDevice = ({ to }: Props) => {
    const recoveryFileData = useSelector(selectRecoveryFileData);

    return (
        <SettingsNavItem
            to={to}
            icon={IcDesktop}
            title={c('Title').t`Device data backup`}
            tooltip={c('Tooltip')
                .t`Save an encryption backup file in this browser to recover your data after a password reset`}
        >
            <span className="flex items-center gap-2">
                <RecoveryDeviceBadge recoveryFileData={recoveryFileData} />
                {recoveryFileData.isAvailableOnDevice && (
                    <span className="text-sm color-weak">{c('Status').t`Available on this device`}</span>
                )}
            </span>
        </SettingsNavItem>
    );
};

export default RecoveryDevice;

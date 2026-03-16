import { c } from 'ttag';

import { useUserSettings } from '@proton/account/index';
import { useUser } from '@proton/account/user/hooks';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcDesktop } from '@proton/icons/icons/IcDesktop';
import { getHasRecoveryMessage } from '@proton/shared/lib/recoveryFile/storage';

interface Props {
    to: string;
}

const RecoveryDeviceBadge = () => {
    const [userSettings, loadingUserSettings] = useUserSettings();

    if (loadingUserSettings || !userSettings) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    const isEnabled = !!userSettings.DeviceRecovery;
    if (isEnabled) {
        return <StatusBadge status={StatusBadgeStatus.On} text={c('Status').t`On`} />;
    }
    return <StatusBadge status={StatusBadgeStatus.Off} text={c('Status').t`Off`} />;
};

const RecoveryDevice = ({ to }: Props) => {
    const [user] = useUser();
    const isAvailableOnDevice = getHasRecoveryMessage(user.ID);

    return (
        <SettingsNavItem
            to={to}
            icon={IcDesktop}
            title={c('Title').t`Device data backup`}
            tooltip={c('Tooltip')
                .t`Save an encryption backup file in this browser to recover your data after a password reset`}
        >
            <span className="flex items-center gap-2">
                <RecoveryDeviceBadge />
                {isAvailableOnDevice && (
                    <span className="text-sm color-weak">{c('Status').t`Available on this device`}</span>
                )}
            </span>
        </SettingsNavItem>
    );
};

export default RecoveryDevice;

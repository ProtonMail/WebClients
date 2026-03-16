import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import useIsSentinelUser from '@proton/components/hooks/useIsSentinelUser';
import { IcQrCode } from '@proton/icons/icons/IcQrCode';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    to: string;
}

const RecoveryQrCodeBadge = () => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loadingUserSettings || loadingIsSentinelUser || !userSettings) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    const isEnabled = !userSettings?.Flags.EdmOptOut;
    if (isSentinelUser && isEnabled) {
        return (
            <StatusBadge
                status={StatusBadgeStatus.Warning}
                text={c('Status').t`Disable QR code sign-in`}
                icon={IcShieldExclamationFilled}
            />
        );
    }
    if (isEnabled) {
        return <StatusBadge status={StatusBadgeStatus.On} text={c('Status').t`On`} />;
    }
    return <StatusBadge status={StatusBadgeStatus.Off} text={c('Status').t`Off`} />;
};

const RecoveryQrCode = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcQrCode}
            title={c('Title').t`QR code sign-in`}
            tooltip={c('Tooltip').t`Allow scanning a QR code from a ${BRAND_NAME} mobile app to sign in`}
        >
            <RecoveryQrCodeBadge />
        </SettingsNavItem>
    );
};

export default RecoveryQrCode;

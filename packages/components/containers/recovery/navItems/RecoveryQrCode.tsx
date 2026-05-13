import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcQrCode } from '@proton/icons/icons/IcQrCode';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    to: string;
}

const RecoveryQrCodeBadge = () => {
    const [userSettings, loadingUserSettings] = useUserSettings();

    if (loadingUserSettings || !userSettings) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    const isEnabled = !userSettings?.Flags.EdmOptOut;
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

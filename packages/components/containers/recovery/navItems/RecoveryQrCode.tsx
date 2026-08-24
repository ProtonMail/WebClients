import { c } from 'ttag';

import { getLastModifiedDate } from '@proton/account/recovery/lastModifiedTime';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { IcQrCode } from '@proton/icons/icons/IcQrCode';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import SettingsNavItem from '../../layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '../../layout/StatusBadge';
import { LastChanged } from '../LastChanged';
import { NavItemStatus } from './NavItemStatus';

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
    const [userSettings] = useUserSettings();

    return (
        <SettingsNavItem
            to={to}
            icon={IcQrCode}
            title={c('Title').t`QR code sign-in`}
            tooltip={c('Tooltip').t`Allow scanning a QR code from a ${BRAND_NAME} mobile app to sign in`}
        >
            <NavItemStatus>
                <RecoveryQrCodeBadge />
                <LastChanged
                    date={getLastModifiedDate(userSettings?.QrCodeSignInLastModifiedTime)}
                    data-testid="account:qr-code-sign-in:last-changed-date"
                />
            </NavItemStatus>
        </SettingsNavItem>
    );
};

export default RecoveryQrCode;

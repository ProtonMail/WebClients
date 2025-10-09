import CalendarLogo from '@proton/components/components/logo/CalendarLogo';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import WalletLogo from '@proton/components/components/logo/WalletLogo';
import {
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
    WALLET_APP_NAME,
} from '@proton/shared/lib/constants';

export const getProtonProducts = () => [
    { icon: PassLogo, name: PASS_APP_NAME, slug: 'pass' },
    { icon: VpnLogo, name: VPN_APP_NAME, slug: 'vpn' },
    { icon: MailLogo, name: MAIL_APP_NAME, slug: 'mail' },
    { icon: CalendarLogo, name: CALENDAR_APP_NAME, slug: 'calendar' },
    { icon: DriveLogo, name: DRIVE_APP_NAME, slug: 'drive' },
    { icon: WalletLogo, name: WALLET_APP_NAME, slug: 'wallet' },
];

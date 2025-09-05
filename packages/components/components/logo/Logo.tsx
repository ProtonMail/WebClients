import type { ReactNode } from 'react';

import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import CalendarLogo from './CalendarLogo';
import DocsLogo from './DocsLogo';
import DriveLogo from './DriveLogo';
import type { LogoProps as LogoBaseProps, LogoVariant } from './LogoBase';
import LumoLogo from './LumoLogo';
import MailLogo from './MailLogo';
import MeetLogo from './MeetLogo';
import PassLogo from './PassLogo';
import VpnLogo from './VpnLogo';
import WalletLogo from './WalletLogo';

const {
    PROTONCALENDAR,
    PROTONDRIVE,
    PROTONMAIL,
    PROTONVPN_SETTINGS,
    PROTONPASS,
    PROTONDOCS,
    PROTONWALLET,
    PROTONLUMO,
    PROTONMEET,
} = APPS;

export type { LogoVariant };

export interface LogoProps extends LogoBaseProps {
    appName: APP_NAMES;
    fallback?: ReactNode;
}

const Logo = ({ appName, fallback = null, ...rest }: LogoProps) => {
    if (appName === PROTONMAIL) {
        return <MailLogo {...rest} />;
    }

    if (appName === PROTONCALENDAR) {
        return <CalendarLogo {...rest} />;
    }

    if (appName === PROTONVPN_SETTINGS) {
        return <VpnLogo {...rest} />;
    }

    if (appName === PROTONDRIVE) {
        return <DriveLogo {...rest} />;
    }

    if (appName === PROTONPASS) {
        return <PassLogo {...rest} />;
    }

    if (appName === PROTONDOCS) {
        return <DocsLogo {...rest} />;
    }

    if (appName === PROTONWALLET) {
        return <WalletLogo {...rest} />;
    }

    if (appName === PROTONLUMO) {
        return <LumoLogo {...rest} />;
    }

    if (appName === PROTONMEET) {
        return <MeetLogo {...rest} />;
    }

    return fallback;
};

export default Logo;

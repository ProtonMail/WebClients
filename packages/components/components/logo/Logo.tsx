import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type { IconSize } from '@proton/components/components/icon/Icon';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import CalendarLogo from './CalendarLogo';
import DriveLogo from './DriveLogo';
import MailLogo from './MailLogo';
import PassLogo from './PassLogo';
import VpnLogo from './VpnLogo';
import WalletLogo from './WalletLogo';

export type LogoVariant = 'with-wordmark' | 'glyph-only' | 'wordmark-only';

const { PROTONCALENDAR, PROTONDRIVE, PROTONMAIL, PROTONVPN_SETTINGS, PROTONPASS, PROTONDOCS, PROTONWALLET } = APPS;

export interface LogoProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'size'> {
    appName: APP_NAMES;
    size?: IconSize;
    variant?: LogoVariant;
    hasTitle?: boolean;
    fallback?: ReactNode;
}

const Logo = ({ appName, variant, fallback = null, ...rest }: LogoProps) => {
    if (appName === PROTONMAIL) {
        return <MailLogo variant={variant} {...rest} />;
    }

    if (appName === PROTONCALENDAR) {
        return <CalendarLogo variant={variant} {...rest} />;
    }

    if (appName === PROTONVPN_SETTINGS) {
        return <VpnLogo variant={variant} {...rest} />;
    }

    if (appName === PROTONDRIVE) {
        return <DriveLogo variant={variant} {...rest} />;
    }

    if (appName === PROTONPASS) {
        return <PassLogo variant={variant} {...rest} />;
    }

    if (appName === PROTONDOCS) {
        // TODO: logo for Proton Docs
        return <DriveLogo variant={variant} {...rest} />;
    }

    if (appName === PROTONWALLET) {
        return <WalletLogo variant={variant} {...rest} />;
    }

    return fallback;
};

export default Logo;

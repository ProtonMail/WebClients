import { ComponentPropsWithoutRef } from 'react';

import { APPS, APP_NAMES } from '@proton/shared/lib/constants';

import { IconSize } from '../icon';
import CalendarLogo from './CalendarLogo';
import DriveLogo from './DriveLogo';
import MailLogo from './MailLogo';
import PassLogo from './PassLogo';
import VpnLogo from './VpnLogo';

export type LogoVariant = 'with-wordmark' | 'glyph-only' | 'wordmark-only';

const { PROTONCALENDAR, PROTONDRIVE, PROTONMAIL, PROTONVPN_SETTINGS, PROTONPASS } = APPS;

export interface LogoProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'size'> {
    appName: APP_NAMES;
    size?: IconSize;
    variant?: LogoVariant;
    hasTitle?: boolean;
}

const Logo = ({ appName, variant, ...rest }: LogoProps) => {
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

    return null;
};

export default Logo;

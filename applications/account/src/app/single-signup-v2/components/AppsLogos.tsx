import React from 'react';

import type { IconSize } from '@proton/components';
import { CalendarLogo, DriveLogo, MailLogo, PassLogo, VpnLogo, WalletLogo } from '@proton/components';
import { type LogoProps } from '@proton/components/components/logo/LogoBase';
import {
    APPS,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
    WALLET_APP_NAME,
    WALLET_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import {
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

interface AppLogo {
    title: string;
    shortTitle: string;
    Logo: ({ ...props }: LogoProps) => React.JSX.Element;
}

type SupportedApp =
    | typeof APPS.PROTONMAIL
    | typeof APPS.PROTONCALENDAR
    | typeof APPS.PROTONDRIVE
    | typeof APPS.PROTONVPN_SETTINGS
    | typeof APPS.PROTONPASS
    | typeof APPS.PROTONWALLET;

const supportedAppLogosMap: Record<SupportedApp, AppLogo> = {
    [APPS.PROTONMAIL]: {
        title: MAIL_APP_NAME,
        shortTitle: MAIL_SHORT_APP_NAME,
        Logo: MailLogo,
    },
    [APPS.PROTONCALENDAR]: {
        title: CALENDAR_APP_NAME,
        shortTitle: CALENDAR_SHORT_APP_NAME,
        Logo: CalendarLogo,
    },
    [APPS.PROTONDRIVE]: {
        title: DRIVE_APP_NAME,
        shortTitle: DRIVE_SHORT_APP_NAME,
        Logo: DriveLogo,
    },
    [APPS.PROTONVPN_SETTINGS]: {
        title: VPN_APP_NAME,
        shortTitle: VPN_SHORT_APP_NAME,
        Logo: VpnLogo,
    },
    [APPS.PROTONPASS]: {
        title: PASS_APP_NAME,
        shortTitle: PASS_SHORT_APP_NAME,
        Logo: PassLogo,
    },
    [APPS.PROTONWALLET]: {
        title: WALLET_APP_NAME,
        shortTitle: WALLET_SHORT_APP_NAME,
        Logo: WalletLogo,
    },
} as const;

interface AppsLogosProps {
    /** Array of apps to display. If not provided, shows all supported apps */
    apps?: SupportedApp[];
    hideAppNames?: boolean;
    logoSize?: IconSize;
    className?: string;
}

const AppsLogos = ({ apps, hideAppNames = false, logoSize = 6, className }: AppsLogosProps) => {
    const appsToShow = apps
        ? apps.map((appName) => supportedAppLogosMap[appName]).filter(isTruthy)
        : Object.values(supportedAppLogosMap);

    return (
        <div className={clsx('flex justify-start flex-nowrap gap-2', className)}>
            {appsToShow.map(({ title, Logo, shortTitle }) => {
                return (
                    <div key={title} title={title} className="flex flex-column items-center gap-0.5">
                        <Logo size={logoSize} variant="glyph-only" />
                        {!hideAppNames && <span className="text-xs color-weak">{shortTitle}</span>}
                    </div>
                );
            })}
        </div>
    );
};

export default AppsLogos;

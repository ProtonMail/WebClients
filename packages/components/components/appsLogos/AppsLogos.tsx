import React from 'react';

import CalendarLogo from '@proton/components/components/logo/CalendarLogo';
import DocsLogo from '@proton/components/components/logo/DocsLogo';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import type { LogoProps } from '@proton/components/components/logo/LogoBase';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import WalletLogo from '@proton/components/components/logo/WalletLogo';
import type { IconSize } from '@proton/icons/types';
import {
    APPS,
    CALENDAR_APP_NAME,
    CALENDAR_SHORT_APP_NAME,
    DOCS_APP_NAME,
    DOCS_SHORT_APP_NAME,
    DRIVE_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_APP_NAME,
    VPN_SHORT_APP_NAME,
    WALLET_APP_NAME,
    WALLET_SHORT_APP_NAME,
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
    | typeof APPS.PROTONWALLET
    | typeof APPS.PROTONDOCS;

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
    [APPS.PROTONDOCS]: {
        title: DOCS_APP_NAME,
        shortTitle: DOCS_SHORT_APP_NAME,
        Logo: DocsLogo,
    },
} as const;

interface AppsLogosProps {
    /** Array of apps to display. If not provided, shows all supported apps */
    apps?: SupportedApp[];
    appNames?: boolean;
    logoSize?: IconSize;
    className?: string;
    iconShape?: 'glyph' | 'appIcon';
    /** When true, shows all supported apps but greys out the ones not in the apps array */
    showDisabledApps?: boolean;
    fullWidth?: boolean;
}

const AppsLogos = ({
    apps,
    appNames = true,
    logoSize = 6,
    className,
    showDisabledApps = false,
    iconShape = 'glyph',
    fullWidth = false,
}: AppsLogosProps) => {
    let appsToShow;
    if (showDisabledApps) {
        appsToShow = Object.entries(supportedAppLogosMap).map(([appKey, appLogo]) => ({
            ...appLogo,
            isDisabled: apps ? !apps.includes(appKey as SupportedApp) : false,
        }));
    } else if (apps) {
        appsToShow = apps.map((appName) => ({ ...supportedAppLogosMap[appName], isDisabled: false })).filter(isTruthy);
    } else {
        appsToShow = Object.values(supportedAppLogosMap).map((appLogo) => ({ ...appLogo, isDisabled: false }));
    }

    return (
        <ul
            className={clsx(
                'unstyled m-0 flex flex-nowrap gap-2',
                fullWidth ? 'w-full justify-space-between' : 'justify-start',
                className
            )}
        >
            {appsToShow.map(({ title, Logo, shortTitle, isDisabled }) => {
                return (
                    <li
                        key={title}
                        title={title}
                        className={clsx(
                            'flex flex-column items-center shrink-0',
                            iconShape === 'appIcon' ? 'gap-1' : 'gap-0.5',
                            isDisabled && 'opacity-40'
                        )}
                    >
                        <div
                            className={clsx(
                                iconShape === 'appIcon' &&
                                    'p-1 ratio-square rounded-lg overflow-hidden flex items-center justify-center border border-weak'
                            )}
                        >
                            <Logo size={logoSize} variant="glyph-only" />
                        </div>
                        {appNames && <span className="text-xs color-weak">{shortTitle}</span>}
                    </li>
                );
            })}
        </ul>
    );
};

export default AppsLogos;

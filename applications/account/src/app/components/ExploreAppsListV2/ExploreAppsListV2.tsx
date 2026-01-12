import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Logo } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import type { PLANS } from '@proton/payments';
import { getHasPlusPlan, getHasProPlan } from '@proton/payments';
import { getHasBusinessProductPlan } from '@proton/payments/core/plan/helpers';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getAppHref, getAppName, getAppShortName } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, PRODUCT_BIT } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getShouldProcessLinkClick } from '@proton/shared/lib/helpers/dom';
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import { getIsBYOEAccount, getIsExternalAccount } from '@proton/shared/lib/keys';
import {
    hasPaidDrive,
    hasPaidLumo,
    hasPaidMail,
    hasPaidMeet,
    hasPaidPass,
    hasPaidVpn,
    hasPaidWallet,
} from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

import LumoLogoAnimated from './LumoLogoAnimated';
import { useExploreAppContextMenu } from './useExploreAppContextMenu';

import './ExploreAppsListV2.scss';

/**
 * Get the correct app href for explore apps
 * VPN and Authenticator live on account.proton.me/{slug}/
 */
const getExploreAppHref = (path: string, appName: APP_NAMES, localID?: number) => {
    if (appName === APPS.PROTONVPN_SETTINGS || appName === APPS.PROTONAUTHENTICATOR) {
        const slug = getSlugFromApp(appName);
        return getAppHref(`/${slug}${path}`, APPS.PROTONACCOUNT, localID);
    }
    return getAppHref(path, appName, localID);
};

/**
 * Get the correct settings href for each app
 * Pass has its own settings page, other apps use the account settings
 */
const getSettingsHref = (appName: APP_NAMES, localID?: number): string => {
    if (appName === APPS.PROTONPASS) {
        return getAppHref('/settings', APPS.PROTONPASS, localID);
    }
    return getAppHref(`/${getSlugFromApp(appName)}`, APPS.PROTONACCOUNT, localID);
};

interface App {
    name: APP_NAMES;
    description: () => string;
    bit: PRODUCT_BIT;
    isNew?: boolean;
    style: CSSProperties;
    priority: number;
}

export const getExploreApps = ({ ...options }: Omit<Parameters<typeof getAvailableApps>[0], 'context'>) => {
    const user = options.user;
    const availableApps = getAvailableApps({ ...options, context: 'dropdown' });

    const priorities = { default: 100, higher: 1, lower: 1000 };

    const getMailPriority = () => {
        if (user) {
            if (hasPaidMail(user)) {
                return priorities.higher;
            }
            if (getIsExternalAccount(user) && !getIsBYOEAccount(user)) {
                return priorities.lower;
            }
        }
        return priorities.default;
    };

    return [
        {
            name: APPS.PROTONMAIL,
            bit: PRODUCT_BIT.MAIL,
            priority: getMailPriority(),
            description: () => {
                // translator: Description for Proton Mail. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Encrypted email`;
            },
            style: {
                '--gradient-hover':
                    'linear-gradient(35.43deg, rgb(188 163 255 / 0.5) 0%, rgb(115 65 255 / 0.5) 88.01%)',
                '--shadow-color-1': 'rgb(66 0 251 / 0.1)',
                '--shadow-color-2': 'rgb(160 125 255 / 0.2)',
                '--shadow-color-3': 'rgb(153 122 255 / 0.3)',
            },
        },
        {
            name: APPS.PROTONCALENDAR,
            bit: PRODUCT_BIT.MAIL,
            priority: getMailPriority(), // Keeps Calendar after Mail
            description: () => {
                // translator: Description for Proton Calendar. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Private scheduling`;
            },
            style: {
                '--gradient-hover':
                    'radial-gradient(204.17% 211.27% at 96.18% -83.43%, rgb(109 74 255 / 0.5) 50.29%, rgb(114 215 255 / 0.5) 99.44%)',
                '--shadow-color-1': 'rgb(108 75 255 / 0.1)',
                '--shadow-color-2': 'rgb(66 121 255 / 0.2)',
                '--shadow-color-3': 'rgb(26 163 255 / 0.3)',
            } as CSSProperties,
        },
        {
            name: APPS.PROTONPASS,
            bit: PRODUCT_BIT.PASS,
            priority: user && hasPaidPass(user) ? priorities.higher : priorities.default,
            description: () => {
                // translator: Description for Proton Pass. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Passwords and identity`;
            },
            style: {
                '--gradient-hover':
                    'radial-gradient(165.6% 153.05% at 0.64% 100%, rgb(255 213 128 / 0.6) 0%, rgb(246 197 146 / 0.6) 9.37%, rgb(235 182 162 / 0.6) 20.5%, rgb(223 165 175 / 0.6) 32.45%, rgb(211 151 190 / 0.6) 42.87%, rgb(196 134 203 / 0.6) 53.37%, rgb(181 120 217 / 0.6) 64.87%, rgb(161 102 229 / 0.6) 77.12%, rgb(139 87 242 / 0.6) 89.12%, rgb(112 76 255 / 0.6) 100%)',
                '--shadow-color-1': 'rgb(241 190 154 / 0.2)',
                '--shadow-color-2': 'rgb(233 179 165 / 0.3)',
                '--shadow-color-3': 'rgb(218 158 182 / 0.5)',
            } as CSSProperties,
        },
        {
            name: APPS.PROTONVPN_SETTINGS,
            bit: PRODUCT_BIT.VPN,
            priority: user && hasPaidVpn(user) ? priorities.higher : priorities.default,
            description: () => {
                // translator: Description for Proton VPN. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Private browsing`;
            },
            style: {
                '--gradient-hover':
                    'radial-gradient(113.78% 100% at 87.82% 0%, rgb(109 74 255 / 0.5) 0%, rgb(84 221 195 / 0.5) 99.44%)',
                '--shadow-color-1': 'rgb(91 103 245 / 0.1)',
                '--shadow-color-2': 'rgb(82 116 240 / 0.2)',
                '--shadow-color-3': 'rgb(24 205 208 / 0.3)',
            } as CSSProperties,
        },
        {
            name: APPS.PROTONLUMO,
            bit: PRODUCT_BIT.LUMO,
            isNew: true,
            priority: user && hasPaidLumo(user) ? priorities.higher : priorities.default,
            description: () => {
                // translator: Description for Lumo. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Private AI assistant`;
            },
            style: {
                '--gradient-hover': 'linear-gradient(45deg, rgb(255 172 46 / 0.5) 0%, rgb(109 74 255 / 0.5) 67.31%)',
                '--shadow-color-1': 'rgb(241 190 154 / 0.2)',
                '--shadow-color-2': 'rgb(233 179 165 / 0.4)',
                '--shadow-color-3': 'rgb(218 158 182 / 0.5)',
            } as CSSProperties,
        },
        {
            name: APPS.PROTONDRIVE,
            bit: PRODUCT_BIT.DRIVE,
            priority: user && hasPaidDrive(user) ? priorities.higher : priorities.default,
            description: () => {
                // translator: Description for Proton Drive. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Secure cloud storage`;
            },
            style: {
                '--gradient-hover':
                    'radial-gradient(112.87% 100% at 73.72% 0%, rgb(109 74 255 / 0.5) 0%, rgb(229 117 202 / 0.5) 100%)',
                '--shadow-color-1': 'rgb(134 84 255 / 0.1)',
                '--shadow-color-2': 'rgb(171 63 255 / 0.2)',
                '--shadow-color-3': 'rgb(244 80 200 / 0.3)',
            } as CSSProperties,
        },
        {
            name: APPS.PROTONDOCS,
            bit: PRODUCT_BIT.DRIVE,
            priority: user && hasPaidDrive(user) ? priorities.higher : priorities.default,
            description: () => {
                // translator: Description for Proton Docs. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Secure online docs`;
            },
            style: {
                '--gradient-hover':
                    'radial-gradient(112.03% 101.5% at 94.23% 0%, rgb(95 103 251 / 0.5) 0%, rgb(105 212 255 / 0.5) 99.44%)',
                '--shadow-color-1': 'rgb(108 75 255 / 0.1)',
                '--shadow-color-2': 'rgb(66 121 255 / 0.2)',
                '--shadow-color-3': 'rgb(26 163 255 / 0.3)',
            } as CSSProperties,
        },
        {
            name: APPS.PROTONSHEETS,
            bit: PRODUCT_BIT.DRIVE,
            priority: user && hasPaidDrive(user) ? priorities.higher : priorities.default,
            description: () => {
                // translator: Description for Proton Sheets. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Secure online sheets`;
            },
            isNew: true,
            style: {
                '--gradient-hover':
                    'radial-gradient(112.03% 101.5% at 94.23% 0%, rgb(95 103 251 / 0.5) 0%, rgb(39 218 122 / 0.5) 99.44%)',
                '--shadow-color-1': 'rgb(31 158 89 / 0.1)',
                '--shadow-color-2': 'rgb(36 199 112 / 0.2)',
                '--shadow-color-3': 'rgb(38 218 121 / 0.3)',
            } as CSSProperties,
        },
        {
            name: APPS.PROTONMEET,
            bit: PRODUCT_BIT.MEET,
            isNew: true,
            priority: user && hasPaidMeet(user) ? priorities.higher : priorities.default,
            description: () => {
                // translator: Description for Proton Meet. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Confidential video calls`;
            },
            style: {
                '--gradient-hover':
                    'radial-gradient(92.31% 87.1% at 18.21% 97.43%, rgb(158 188 255 / 0.5) 0%, rgb(136 123 255 / 0.5) 41.88%, rgb(109 74 255 / 0.5) 71.63%)',
                '--shadow-color-1': 'rgb(109 74 255 / 0.1)',
                '--shadow-color-2': 'rgb(115 100 255 / 0.2)',
                '--shadow-color-3': 'rgb(113 157 255 / 0.3)',
            } as CSSProperties,
        },
        {
            name: APPS.PROTONWALLET,
            bit: PRODUCT_BIT.WALLET,
            priority: user && hasPaidWallet(user) ? priorities.higher : priorities.default,
            description: () => {
                // translator: Description for Proton Wallet. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Bitcoin wallet`;
            },
            style: {
                '--gradient-hover':
                    'linear-gradient(208.15deg, rgb(109 74 255 / 0.5) 25.04%, rgb(255 128 101 / 0.5) 74.79%, rgb(255 165 31 / 0.5) 99.12%)',
                '--shadow-color-1': 'rgb(123 76 244 / 0.1)',
                '--shadow-color-2': 'rgb(220 110 142 / 0.2)',
                '--shadow-color-3': 'rgb(240 139 86 / 0.3)',
            } as CSSProperties,
        },
    ]
        .sort((a, b) => a.priority - b.priority)
        .filter(({ name }) => availableApps.includes(name));
};

interface Props {
    onExplore: (app: APP_NAMES) => Promise<void>;
    apps: App[];
    subscription: {
        subscribed: number;
        plan: PLANS | undefined;
    };
    localID?: number;
}

const allBits =
    PRODUCT_BIT.MAIL |
    PRODUCT_BIT.PASS |
    PRODUCT_BIT.DRIVE |
    PRODUCT_BIT.VPN |
    PRODUCT_BIT.WALLET |
    PRODUCT_BIT.LUMO |
    PRODUCT_BIT.MEET;

const getNameFromPlan = (plan?: PLANS) => {
    if (!plan) {
        return '';
    }
    if (getHasProPlan(plan)) {
        return 'Essentials';
    }
    if (getHasBusinessProductPlan(plan)) {
        return 'Professional';
    }
    if (getHasPlusPlan(plan)) {
        return 'Plus';
    }
};

const getGridColsClass = (count: number) => {
    if (count > 10) {
        return 'grid grid-cols-3 md:grid-cols-6';
    }
    if (count >= 5) {
        return 'grid grid-cols-3 md:grid-cols-5';
    }
    if (count === 4) {
        return 'grid grid-cols-3 md:grid-cols-4';
    }
    if (count === 3) {
        return 'grid grid-cols-3 md:grid-cols-3';
    }
    if (count === 2) {
        return 'grid grid-cols-2 md:grid-cols-2';
    }
    return 'grid grid-cols-1';
};

const AppIcon = ({ children, appName }: { children: ReactNode; appName: APP_NAMES }) => {
    return (
        <div
            className={clsx(
                `explore-app-icon explore-app-icon-${appName}`,
                'shrink-0 p-2 flex items-center justify-center w-custom h-custom mb-2'
            )}
            style={{ '--w-custom': '4.5rem', '--h-custom': '4.5rem' }}
        >
            {children}
        </div>
    );
};

const ExploreAppsListV2 = ({ onExplore, apps, subscription, localID }: Props) => {
    const [loading, withLoading] = useLoading();
    const [type, setType] = useState<APP_NAMES | null>(null);

    const { contextMenu, onContextMenu } = useExploreAppContextMenu();

    let planName = getNameFromPlan(subscription.plan);
    if (hasBit(subscription.subscribed, allBits)) {
        planName = '';
    }

    return (
        <nav className="flex gap-2 justify-center px-4 pb-4">
            <ul
                className={clsx(
                    'explore-apps-list unstyled m-0 gap-4 md:gap-6 lg:gap-8 ',
                    getGridColsClass(apps.length)
                )}
            >
                {apps.map((app, index) => {
                    const appName = app.name;
                    const name = getAppShortName(appName);
                    const description = app.description();
                    const showLoader = type === appName && loading;
                    const paid = hasBit(subscription.subscribed, app.bit);
                    const isNew = app.isNew;
                    const href = getExploreAppHref('/', appName, localID);
                    const settingsHref = getSettingsHref(appName, localID);
                    return (
                        <li className="explore-apps-list-item" key={appName} style={{ '--animation-order': index }}>
                            <a
                                href={href}
                                data-testid={appName.replace('proton-', 'explore-')}
                                onClick={(event) => {
                                    if (loading) {
                                        event.preventDefault();
                                        return;
                                    }
                                    const target = event.currentTarget?.getAttribute('target') || '';
                                    if (getShouldProcessLinkClick(event.nativeEvent, target)) {
                                        event.preventDefault();
                                        setType(appName);
                                        void withLoading(onExplore(appName));
                                        return;
                                    }
                                    // Otherwise let link (e.g. new tab) clicks fall through
                                }}
                                onContextMenu={(e) => onContextMenu(e, href, settingsHref)}
                                aria-label={goToPlanOrAppNameText(getAppName(appName))}
                                className={clsx(
                                    `explore-app explore-app-${appName}`,
                                    'flex flex-column items-center flex-nowrap gap-1 text-no-decoration text-center',
                                    showLoader && 'pointer-events-none'
                                )}
                                style={app.style}
                            >
                                <div className="relative">
                                    <AppIcon appName={appName}>
                                        {appName === APPS.PROTONLUMO ? (
                                            <LumoLogoAnimated
                                                size={12}
                                                variant="glyph-only"
                                                className="shrink-0"
                                                hasTitle={false}
                                            />
                                        ) : (
                                            <Logo
                                                appName={appName}
                                                size={12}
                                                variant="glyph-only"
                                                className="shrink-0"
                                                aria-hidden="true"
                                                hasTitle={false}
                                            />
                                        )}
                                    </AppIcon>
                                    {isNew && (
                                        <span className="explore-app-new-badge absolute text-xs rounded-full px-2 py-1 text-semibold">
                                            {c('Info').t`New`}
                                        </span>
                                    )}
                                </div>

                                <div className="explore-app-name relative">
                                    <span className={clsx(showLoader && 'opacity-0')}>{name}</span>
                                    {showLoader && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <CircleLoader />
                                        </span>
                                    )}
                                </div>
                                <div className="relative flex justify-center">
                                    {paid && planName ? (
                                        <span className="explore-app-plan-badge color-primary text-semibold text-sm rounded-full px-2 py-0.5">
                                            {planName}
                                        </span>
                                    ) : undefined}
                                    <div className="explore-app-description hidden md:block text-sm color-weak">
                                        {description}
                                    </div>
                                </div>
                            </a>
                        </li>
                    );
                })}
            </ul>
            {contextMenu}
        </nav>
    );
};
export default ExploreAppsListV2;

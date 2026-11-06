import type { CSSProperties } from 'react';

import { c } from 'ttag';

import type { AvailableApp, AvailableAppName, PlanTier } from '@proton/account/availableApps/apps';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces/User';
import { getIsBYOEAccount, getIsExternalAccount } from '@proton/shared/lib/keys/accountType';

export interface App {
    name: APP_NAMES;
    description: () => string;
    isNew?: boolean;
    style: CSSProperties;
    isForbidden?: boolean;
    /** The tier of the plan the app comes with, shown under it */
    tier?: PlanTier | null;
}

/**
 * Every app the available apps can list needs one, so a missing one doesn't build. Their order is the list's, before
 * the user's plan and account move apps.
 */
const getAppConfigs = (): Record<AvailableAppName, Omit<App, 'name' | 'tier' | 'isForbidden'>> => {
    return {
        [APPS.PROTONMAIL]: {
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
        [APPS.PROTONCALENDAR]: {
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
        [APPS.PROTONPASS]: {
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
        [APPS.PROTONVPN_SETTINGS]: {
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
        [APPS.PROTONLUMO]: {
            isNew: true,
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
        [APPS.PROTONDRIVE]: {
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
        [APPS.PROTONDOCS]: {
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
        [APPS.PROTONSHEETS]: {
            description: () => {
                // translator: Description for Proton Sheets. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Secure online sheets`;
            },
            style: {
                '--gradient-hover':
                    'radial-gradient(112.03% 101.5% at 94.23% 0%, rgb(95 103 251 / 0.5) 0%, rgb(39 218 122 / 0.5) 99.44%)',
                '--shadow-color-1': 'rgb(31 158 89 / 0.1)',
                '--shadow-color-2': 'rgb(36 199 112 / 0.2)',
                '--shadow-color-3': 'rgb(38 218 121 / 0.3)',
            } as CSSProperties,
        },
        [APPS.PROTONMEET]: {
            isNew: true,
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
        [APPS.PROTONWALLET]: {
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
        [APPS.PROTONSPACES]: {
            isNew: true,
            description: () => {
                // translator: Description for Proton Spaces. As concise as possible, under 20 characters please
                return c('app-switcher_2025').t`Secure and end-to-end encrypted`;
            },
            style: {
                '--gradient-hover':
                    'linear-gradient(35.43deg, rgb(188 163 255 / 0.5) 0%, rgb(115 65 255 / 0.5) 88.01%)',
                '--shadow-color-1': 'rgb(66 0 251 / 0.1)',
                '--shadow-color-2': 'rgb(160 125 255 / 0.2)',
                '--shadow-color-3': 'rgb(153 122 255 / 0.3)',
            },
        },
    };
};

/** Apps with a tier first, and Mail and Calendar last for an external account, which sets up its address in them */
export const getExploreApps = (availableApps: AvailableApp[], user: User): App[] => {
    const configs = getAppConfigs();
    const order = Object.keys(configs);
    const isExternal = getIsExternalAccount(user) && !getIsBYOEAccount(user);
    const getGroup = ({ name, tier }: App) => {
        if (tier) {
            return 0;
        }
        return isExternal && (name === APPS.PROTONMAIL || name === APPS.PROTONCALENDAR) ? 2 : 1;
    };
    return availableApps
        .map(({ app, tier }): App => ({ name: app, ...configs[app], tier }))
        .sort((a, b) => getGroup(a) - getGroup(b) || order.indexOf(a.name) - order.indexOf(b.name));
};

export const getForbiddenAppConfigs = (forbiddenApps: Set<APP_NAMES>): App[] => {
    return Object.entries(getAppConfigs())
        .filter(([name]) => forbiddenApps.has(name as AvailableAppName))
        .map(([name, config]) => ({
            name: name as AvailableAppName,
            ...config,
            style: { filter: 'grayscale(100%)', opacity: 0.5 },
            isForbidden: true,
        }));
};

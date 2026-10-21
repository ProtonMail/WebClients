import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Logo from '@proton/components/components/logo/Logo';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { getAppHref, getAppName, getAppShortName } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getIsEventModified, getShouldProcessLinkClick } from '@proton/shared/lib/helpers/dom';
import { wait } from '@proton/shared/lib/helpers/promise';
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import clsx from '@proton/utils/clsx';

import { getSettingsHref } from '../../content/helper';
import LumoLogoAnimated from './LumoLogoAnimated';
import type { App } from './exploreApps';
import { useExploreAppsListTelemetry } from './exploreAppsListTelemetry';
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

interface Props {
    onExplore: (app: APP_NAMES) => Promise<void>;
    apps: App[];
    localID?: number;
}

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

const getShouldObserveAppClick = (event: MouseEvent) => {
    const middleClick = event.button === 1;
    const leftClick = event.button === 0;

    return leftClick || middleClick;
};

const getWillLikelyOpenInNewTab = (event: MouseEvent) => {
    const middleClick = event.button === 1;
    const leftClick = event.button === 0;

    return middleClick || (leftClick && getIsEventModified(event));
};

const ExploreAppsListV2 = ({ onExplore, apps, localID }: Props) => {
    const [loading, withLoading] = useLoadingByKey();
    const { sendPageLoad, sendAppClick } = useExploreAppsListTelemetry();

    const { contextMenu, onContextMenu } = useExploreAppContextMenu();

    useEffect(() => {
        sendPageLoad();
    }, [sendPageLoad]);

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
                    const showLoader = loading[appName];
                    const isNew = app.isNew;
                    const appHref = getExploreAppHref('/', appName, localID);
                    const settingsHref = getSettingsHref(appName, localID);
                    const isForbidden = app.isForbidden;

                    return (
                        <li className="explore-apps-list-item" key={appName} style={{ '--animation-order': index }}>
                            <a
                                href={appHref}
                                data-testid={appName.replace('proton-', 'explore-')}
                                onClick={async (event) => {
                                    if (Object.values(loading).some((i) => i === true) || isForbidden) {
                                        event.preventDefault();
                                        return;
                                    }

                                    const target = event.currentTarget?.getAttribute('target') || '';
                                    const shouldProcessClick = getShouldProcessLinkClick(event.nativeEvent, target);
                                    // Prevent default `a` behavior before calling telemetry to keep this synchronous
                                    if (shouldProcessClick) {
                                        event.preventDefault();
                                    }

                                    if (getShouldObserveAppClick(event.nativeEvent)) {
                                        sendAppClick({
                                            appName,
                                            openMethod: getWillLikelyOpenInNewTab(event.nativeEvent)
                                                ? 'new_tab'
                                                : 'same_tab',
                                        });
                                        await wait(50); // This ensures the telemetry event has time to be initiated and sent before the page redirects
                                    }

                                    if (shouldProcessClick) {
                                        await withLoading(appName, onExplore(appName));
                                        return;
                                    }
                                    // Otherwise let link (e.g. new tab) clicks fall through
                                }}
                                onContextMenu={(event) => {
                                    if (isForbidden) {
                                        event.preventDefault();
                                        return;
                                    }
                                    onContextMenu({ event, appHref, settingsHref, appName });
                                }}
                                aria-label={goToPlanOrAppNameText(getAppName(appName))}
                                className={clsx(
                                    `explore-app explore-app-${appName}`,
                                    'flex flex-column items-center flex-nowrap gap-1 text-no-decoration text-center',
                                    showLoader && 'pointer-events-none',
                                    isForbidden && 'explore-app-inaccessible cursor-not-allowed'
                                )}
                                style={app.style}
                            >
                                <div className="relative">
                                    <AppIcon appName={appName}>
                                        {appName === APPS.PROTONLUMO && !isForbidden ? (
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
                                    {isNew && !isForbidden && (
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
                                    {app.tier && !isForbidden ? (
                                        <span className="explore-app-plan-badge color-primary text-semibold text-sm rounded-full px-2 py-0.5">
                                            {app.tier}
                                        </span>
                                    ) : undefined}
                                    <div className="explore-app-description hidden md:block text-sm color-weak">
                                        {isForbidden ? c('Info').t`${name} is not available` : description}
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

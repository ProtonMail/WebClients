import type { ReactNode } from 'react';
import { Suspense, lazy, useEffect, useLayoutEffect } from 'react';

import { c } from 'ttag';

import { useGetBreachesCounts } from '@proton/account';
import DrawerContactView from '@proton/components/components/drawer/views/DrawerContactView';
import DrawerSettingsView from '@proton/components/components/drawer/views/DrawerSettingsView';
import Loader from '@proton/components/components/loader/Loader';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import type { CustomAction } from '@proton/components/containers/contacts/widget/types';
import { useReferralDiscover } from '@proton/components/containers/referral/hooks/useReferralDiscover';
import useConfig from '@proton/components/hooks/useConfig';
import { APPS } from '@proton/shared/lib/constants';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import useDrawer from '../../hooks/drawer/useDrawer';
import DrawerContactModals from './DrawerContactModals';
import DrawerSecurityCenterView from './views/DrawerSecurityCenterView';
import useSecurityCenter from './views/SecurityCenter/useSecurityCenter';
import useLumoInMail from './views/lumoAgent/useLumoInMail';
import DrawerReferralView from './views/referral/DrawerReferralView';
import DrawerVPNView from './views/vpn/DrawerVPNView';
import useVPNDrawer from './views/vpn/useVPNDrawer';

import './DrawerApp.scss';

// Lazy so the Lumo panel + @proton/lumo-ui load only when the tab is opened — kept out of the eager
// bundle of every app that mounts the drawer.
const DrawerLumoView = lazy(() => import('./views/DrawerLumoView'));

interface Props {
    /**
     * Shared
     */
    customAppSettings?: ReactNode;
    /**
     * Mail specific
     */
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onMailTo?: (src: string) => void;
    /**
     * Calendar specific
     */
    contactCustomActions?: CustomAction[];
    /**
     * To catch clicks on or bubbling to the `aside` element
     */
    onContainerClick?: () => void;
}

const DrawerApp = ({ customAppSettings, onCompose, onMailTo, contactCustomActions, onContainerClick }: Props) => {
    const { APP_NAME } = useConfig();
    const { appInView, iframeSrcMap } = useDrawer();
    const isSecurityCenterEnabled = useSecurityCenter();
    const isVPNDrawerEnabled = useVPNDrawer();
    const isLumoInMailEnabled = useLumoInMail() && APP_NAME === APPS.PROTONMAIL;
    const isLumoInDriveEnabled = useFlag('DriveWebLumo') && APP_NAME === APPS.PROTONDRIVE;
    const isLumoInAppEnabled = isLumoInMailEnabled || isLumoInDriveEnabled;
    const getBreachesCount = useGetBreachesCounts();
    const canDisplayBreachNotifications = useFlag('BreachAlertsNotificationsCommon');
    const { canShowDrawerApp } = useReferralDiscover();

    const isDisplayedOnMobile =
        appInView === DRAWER_NATIVE_APPS.CONTACTS || appInView === DRAWER_NATIVE_APPS.SECURITY_CENTER;

    useLayoutEffect(() => {
        if (appInView !== undefined) {
            document.body.classList.add('drawer-is-open');
        }
        return () => {
            document.body.classList.remove('drawer-is-open');
        };
    }, [appInView]);

    useEffect(() => {
        if (canDisplayBreachNotifications) {
            getBreachesCount().catch(noop);
        }
    }, [getBreachesCount, canDisplayBreachNotifications]);

    return (
        <>
            <DrawerContactModals />
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
            <aside
                className={clsx([
                    'drawer-app border-left border-weak bg-norm overflow-hidden no-print',
                    !appInView && 'hidden',
                    !isDisplayedOnMobile && 'drawer-app--hide-on-mobile',
                ])}
                onClick={onContainerClick}
                aria-labelledby="drawer-heading"
            >
                <ErrorBoundary
                    component={<StandardErrorPage />}
                    initiative={appInView === DRAWER_NATIVE_APPS.SECURITY_CENTER ? 'drawer-security-center' : undefined}
                >
                    <h1 id="drawer-heading" className="sr-only">{
                        // translator: this is a hidden text for a11y purposes => in this case, "Drawer" is the section that contains Contacts/Security center/etc. (can be translated as "Aside panel" if Drawer does not mean anything in your language)
                        c('Header').t`Drawer`
                    }</h1>
                    <div className="drawer-app-inner h-full w-full">
                        {Object.entries(iframeSrcMap)
                            .filter(([, src]) => src)
                            .map(([app, src]) => (
                                <iframe
                                    key={app}
                                    id={`drawer-app-iframe-${app}`}
                                    className={clsx(['drawer-app-view h-full w-full', appInView !== app && 'hidden'])}
                                    src={src}
                                    title={c('Info').t`Calendar side panel`}
                                    allow="clipboard-read; clipboard-write"
                                />
                            ))}

                        {appInView === DRAWER_NATIVE_APPS.CONTACTS && (
                            <DrawerContactView
                                onCompose={onCompose}
                                onMailTo={onMailTo}
                                customActions={contactCustomActions}
                            />
                        )}

                        {appInView === DRAWER_NATIVE_APPS.QUICK_SETTINGS && (
                            <DrawerSettingsView customAppSettings={customAppSettings} />
                        )}

                        {isSecurityCenterEnabled && appInView === DRAWER_NATIVE_APPS.SECURITY_CENTER && (
                            <DrawerSecurityCenterView />
                        )}

                        {isVPNDrawerEnabled && appInView === DRAWER_NATIVE_APPS.VPN && <DrawerVPNView />}

                        {canShowDrawerApp && appInView === DRAWER_NATIVE_APPS.REFERRAL && <DrawerReferralView />}

                        {isLumoInAppEnabled && appInView === DRAWER_NATIVE_APPS.LUMO && (
                            <Suspense fallback={<Loader size="large" />}>
                                <DrawerLumoView />
                            </Suspense>
                        )}
                    </div>
                </ErrorBoundary>
            </aside>
        </>
    );
};

export default DrawerApp;

import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect } from 'react';

import { c } from 'ttag';

import DrawerContactView from '@proton/components/components/drawer/views/DrawerContactView';
import DrawerSettingsView from '@proton/components/components/drawer/views/DrawerSettingsView';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import type { CustomAction } from '@proton/components/containers/contacts/widget/types';
import { useReferralDiscover } from '@proton/components/containers/referral/hooks/useReferralDiscover';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import useDrawer from '../../hooks/drawer/useDrawer';
import DrawerContactModals from './DrawerContactModals';
import DrawerSecurityCenterView from './views/DrawerSecurityCenterView';
import { useGetBreachesCounts } from './views/SecurityCenter/BreachAlerts/slice/breachNotificationsSlice';
import useSecurityCenter from './views/SecurityCenter/useSecurityCenter';
import DrawerReferralView from './views/referral/DrawerReferralView';
import DrawerVPNView from './views/vpn/DrawerVPNView';
import useVPNDrawer from './views/vpn/useVPNDrawer';

import './DrawerApp.scss';

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
    const { appInView, iframeSrcMap } = useDrawer();
    const isSecurityCenterEnabled = useSecurityCenter();
    const isVPNDrawerEnabled = useVPNDrawer();
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
                    // eslint-disable-next-line custom-rules/deprecate-responsive-utility-classes
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
                    </div>
                </ErrorBoundary>
            </aside>
        </>
    );
};

export default DrawerApp;

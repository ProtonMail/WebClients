import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect } from 'react';

import { c } from 'ttag';

import DrawerContactView from '@proton/components/components/drawer/views/DrawerContactView';
import DrawerSettingsView from '@proton/components/components/drawer/views/DrawerSettingsView';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import type { CustomAction } from '@proton/components/containers/contacts/widget/types';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useDrawer } from '../../hooks';
import DrawerContactModals from './DrawerContactModals';
import DrawerSecurityCenterView from './views/DrawerSecurityCenterView';
import { useGetBreachesCounts } from './views/SecurityCenter/BreachAlerts/slice/breachNotificationsSlice';
import useSecurityCenter from './views/SecurityCenter/useSecurityCenter';

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
    const getBreachesCount = useGetBreachesCounts();
    const canDisplayBreachNotifications = useFlag('BreachAlertsNotificationsCommon');

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
            <aside
                className={clsx([
                    'drawer-app border-left border-weak bg-norm overflow-hidden no-print',
                    !appInView && 'hidden',
                    !isDisplayedOnMobile && 'drawer-app--hide-on-mobile',
                ])}
                onClick={onContainerClick}
            >
                <ErrorBoundary
                    component={<StandardErrorPage />}
                    initiative={appInView === DRAWER_NATIVE_APPS.SECURITY_CENTER ? 'drawer-security-center' : undefined}
                >
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
                    </div>
                </ErrorBoundary>
            </aside>
        </>
    );
};

export default DrawerApp;

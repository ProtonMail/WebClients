import { ReactNode, useLayoutEffect } from 'react';

import { c } from 'ttag';

import DrawerContactView from '@proton/components/components/drawer/views/DrawerContactView';
import DrawerSettingsView from '@proton/components/components/drawer/views/DrawerSettingsView';
import { ErrorBoundary, StandardErrorPage } from '@proton/components/containers';
import { CustomAction } from '@proton/components/containers/contacts/widget/types';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { Recipient } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useDrawer } from '../../hooks';
import DrawerContactModals from './DrawerContactModals';
import DrawerSecurityCenterView from './views/DrawerSecurityCenterView';
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

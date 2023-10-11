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
}

const DrawerApp = ({ customAppSettings, onCompose, onMailTo, contactCustomActions }: Props) => {
    const { appInView, iframeSrcMap } = useDrawer();

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
                    appInView !== DRAWER_NATIVE_APPS.CONTACTS && 'drawer-app--hide-on-mobile',
                ])}
            >
                <ErrorBoundary component={<StandardErrorPage />}>
                    <div className="drawer-app-inner h100 w-full">
                        {Object.entries(iframeSrcMap)
                            .filter(([, src]) => src)
                            .map(([app, src]) => (
                                <iframe
                                    key={app}
                                    id={`drawer-app-iframe-${app}`}
                                    className={clsx(['drawer-app-view h100 w-full', appInView !== app && 'hidden'])}
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
                    </div>
                </ErrorBoundary>
            </aside>
        </>
    );
};

export default DrawerApp;

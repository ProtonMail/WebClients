import { useLayoutEffect } from 'react';

import '@proton/components/components/drawer/DrawerApp.scss';
import DrawerSettingsView from '@proton/components/components/drawer/views/DrawerSettingsView';
import { ErrorBoundary, StandardErrorPage } from '@proton/components/containers';
import { useDrawer } from '@proton/components/hooks';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import clsx from '@proton/utils/clsx';

import { DrawerWalletView } from './DrawerWalletView';
import WalletQuickSettings from './WalletQuickSettings';

export const WalletDrawerApp = () => {
    const { appInView } = useDrawer();

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
            <aside
                className={clsx([
                    'drawer-app border-left border-weak bg-norm overflow-hidden no-print',
                    !appInView && 'hidden',
                ])}
            >
                <ErrorBoundary component={<StandardErrorPage />}>
                    <div className="drawer-app-inner h-full w-full">
                        {appInView === DRAWER_NATIVE_APPS.WALLET_QUICK_ACTIONS && <DrawerWalletView />}

                        {appInView === DRAWER_NATIVE_APPS.QUICK_SETTINGS && (
                            <DrawerSettingsView customAppSettings={<WalletQuickSettings />} />
                        )}
                    </div>
                </ErrorBoundary>
            </aside>
        </>
    );
};

import { type FC, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { BottomBar } from '@proton/pass/components/Layout/Bar/BottomBar';
import { clientOffline } from '@proton/pass/lib/client';
import { offlineResume } from '@proton/pass/store/actions';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useServiceWorkerState } from './ServiceWorker/client/ServiceWorkerProvider';
import { PrivateApp } from './Views/PrivateApp';
import { PublicRouter } from './Views/PublicRouter';

export const AppGuard: FC = () => {
    const dispatch = useDispatch();
    const state = useAppState();
    const authStore = useAuthStore();
    const auth = useAuthService();

    const online = useOnline();
    const updateAvailable = useServiceWorkerState()?.updateAvailable ?? false;

    useEffect(() => {
        const localID = authStore?.getLocalID();
        const { status } = AppStateManager.getState();
        if (online && clientOffline(status)) dispatch(offlineResume.intent({ localID }));
    }, [online]);

    /** Auto lock when the desktop app hide the window.
     * On Web, ctxBridge will be undefined and the rest will be ignored */
    useEffect(
        () =>
            window.ctxBridge?.onWindowHide(async () => {
                const mode = authStore?.getLockMode();
                if (mode) await auth.lock(mode, { soft: true });
            }),
        []
    );

    return (
        <>
            {state.booted ? <PrivateApp /> : <PublicRouter />}
            {online && updateAvailable && (
                <BottomBar
                    className="bg-danger absolute bottom-0"
                    text={
                        <span className="text-center">
                            {c('Info')
                                .t`A new version of ${PASS_APP_NAME} is available. Update it to enjoy the latest features and bug fixes.`}
                            <InlineLinkButton className="text-semibold px-1" onClick={() => window.location.reload()}>
                                {c('Action').t`Reload`}
                            </InlineLinkButton>
                        </span>
                    }
                />
            )}
        </>
    );
};

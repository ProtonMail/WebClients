import { useCallback } from 'react';

import type { Store } from 'redux';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import type { ReauthActionPayload } from '@proton/pass/lib/auth/reauth';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { exportData } from '@proton/pass/store/actions/creators/transfer';
import { asyncRequestDispatcherFactory } from '@proton/pass/store/request/utils';
import type { State } from '@proton/pass/store/types';
import { download } from '@proton/pass/utils/dom/download';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

const REAUTH_KEY = 'notification:reauth';

export const useReauthActionHandler = (store: Store<State>) => {
    const authStore = useAuthStore();

    const { createNotification } = useNotifications();
    const enhance = useNotificationEnhancer();
    const dispatch = asyncRequestDispatcherFactory(store.dispatch);

    return useCallback(async (reauth: ReauthActionPayload) => {
        switch (reauth.type) {
            case ReauthAction.SSO_EXPORT:
                createNotification(
                    enhance({
                        type: 'info',
                        text: c('Info').t`Exporting your data...`,
                        loading: true,
                        key: REAUTH_KEY,
                        expiration: -1,
                        showCloseButton: false,
                    })
                );

                const result = await dispatch(exportData, reauth.data);

                const ok = result.type === 'success';

                return setTimeout(async () => {
                    createNotification({
                        type: ok ? 'success' : 'error',
                        text: ok
                            ? c('Info').t`Successfully exported all your items`
                            : c('Warning').t`An error occurred while exporting your data`,
                        key: REAUTH_KEY,
                    });

                    if (ok) {
                        const filename = result.data;
                        const file = await fileStorage.readFile(filename);
                        if (file) download(file, filename);
                    }
                }, 1_500);

            case ReauthAction.SSO_PW_LOCK:
                return createNotification({
                    type: 'info',
                    text: c('Info').t`Password lock successfully registered. Use it to unlock ${PASS_APP_NAME}`,
                });

            case ReauthAction.SSO_BIOMETRICS:
                return createNotification({
                    type: 'info',
                    text: c('Info').t`Biometrics lock successfully registered. Use it to unlock ${PASS_APP_NAME}`,
                });

            case ReauthAction.SSO_OFFLINE:
                if (authStore?.hasOfflinePassword()) {
                    return createNotification({
                        type: 'info',
                        text: c('Info')
                            .t`You can now use your ${BRAND_NAME} password to access ${PASS_SHORT_APP_NAME} offline`,
                    });
                }
        }
    }, []);
};

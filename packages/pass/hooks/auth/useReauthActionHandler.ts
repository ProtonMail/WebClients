import { useCallback } from 'react';

import type { Store } from 'redux';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useAuthStore } from '../../components/Core/AuthStoreProvider';
import { useCurrentPort, useCurrentTabID } from '../../components/Core/PassCoreProvider';
import { useStablePasswordTypeSwitch } from '../../components/Lock/PasswordUnlockProvider';
import type { ReauthActionPayload } from '../../lib/auth/reauth';
import { ReauthAction } from '../../lib/auth/reauth';
import { mimetypeForDownload } from '../../lib/file-attachments/helpers';
import { getSafeStorage } from '../../lib/file-storage/utils';
import { exportData } from '../../store/actions/creators/export';
import { asyncRequestDispatcherFactory } from '../../store/request/utils';
import type { State } from '../../store/types';
import { download } from '../../utils/dom/download';
import { useNotificationEnhancer } from '../useNotificationEnhancer';

const REAUTH_KEY = 'notification:reauth';

export const useReauthActionHandler = (store: Store<State>) => {
    const authStore = useAuthStore();
    const tabId = useCurrentTabID();
    const port = useCurrentPort();

    const { createNotification } = useNotifications();
    const enhance = useNotificationEnhancer();
    const dispatch = asyncRequestDispatcherFactory(store.dispatch);
    const passwordTypeSwitch = useStablePasswordTypeSwitch(store);

    return useCallback(async (reauth: ReauthActionPayload) => {
        switch (reauth.type) {
            case ReauthAction.EXPORT_CONFIRM:
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

                const result = await dispatch(exportData, { ...reauth.data, tabId, port });

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
                        let { mimeType, fileRef, storageType } = result.data;
                        mimeType = mimetypeForDownload(mimeType);
                        const fs = getSafeStorage(storageType);
                        const file = await fs.readFile(fileRef, mimeType);
                        if (file) download(file, fileRef);
                    }
                }, 1_500);

            case ReauthAction.PW_LOCK_SETUP:
                return createNotification({
                    type: 'info',
                    text: c('Info').t`Password lock successfully registered. Use it to unlock ${PASS_APP_NAME}`,
                });

            case ReauthAction.BIOMETRICS_SETUP:
                return createNotification({
                    type: 'info',
                    text: c('Info').t`Biometrics lock successfully registered. Use it to unlock ${PASS_APP_NAME}`,
                });

            case ReauthAction.OFFLINE_SETUP:
                /** The fork may carry no offline key material - SSO accounts whose
                 * password never reaches account, or a swallowed argon2 failure in
                 * `generateOfflineKey`. The offline components cannot be derived in
                 * that case: report it instead of leaving the user without feedback. */
                if (!authStore?.hasOfflinePassword()) {
                    return createNotification({
                        type: 'error',
                        text: c('Warning').t`Identity could not be confirmed`,
                    });
                }

                return createNotification({
                    type: 'info',
                    text: passwordTypeSwitch({
                        extra: c('Info')
                            .t`You can now use your extra password to access ${PASS_SHORT_APP_NAME} offline`,
                        twoPwd: c('Info')
                            .t`You can now use your second password to access ${PASS_SHORT_APP_NAME} offline`,
                        sso: c('Info').t`You can now use your backup password to access ${PASS_SHORT_APP_NAME} offline`,
                        default: c('Info')
                            .t`You can now use your ${BRAND_NAME} password to access ${PASS_SHORT_APP_NAME} offline`,
                    }),
                });
        }
    }, []);
};

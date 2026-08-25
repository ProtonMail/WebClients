import { type FC, useCallback, useEffect } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import useStateRef from '@proton/hooks/useStateRef';

import type { UpdateStore } from '../../../types/desktop';
import { UpdateStatus as UpdateStatusEnum } from '../../../types/desktop';
import { logger } from '../../../utils/logger';
import { usePassCore } from '../../Core/PassCoreProvider';
import { SettingsPanel } from '../SettingsPanel';
import { Beta } from './Beta.desktop';
import { getErrorLabel } from './Update.utils.desktop';
import { UpdateStatus } from './UpdateStatus.desktop';

const DEFAULT_UPDATE_STORE = (currentVersion: string): UpdateStore => ({
    distribution: 0,
    beta: false,
    status: UpdateStatusEnum.Idle,
    errorType: null,
    currentVersion,
    newVersion: null,
    progress: null,
    mockUpdateBaseUrl: null,
    mockDownload: false,
    mockDoDownloadError: false,
});

const useUpdateStore = () => {
    const { createNotification } = useNotifications();
    const { config } = usePassCore();
    const [updateStore, setUpdateStore, updateStoreRef] = useStateRef<UpdateStore>(
        DEFAULT_UPDATE_STORE(config.APP_VERSION)
    );

    const handleUpdateStoreChange = useCallback((store: UpdateStore) => {
        if (updateStoreRef.current.status !== UpdateStatusEnum.Error && store.status === UpdateStatusEnum.Error) {
            createNotification({ text: getErrorLabel(store.errorType), type: 'error' });
        }
        setUpdateStore(store);
    }, []);

    useEffect(() => {
        void window.ctxBridge?.getUpdateStore().then(setUpdateStore);
        const clearUpdateStoreChange = window.ctxBridge?.onUpdateStoreChange(handleUpdateStoreChange);
        return () => {
            clearUpdateStoreChange?.();
            if (updateStoreRef.current.status === UpdateStatusEnum.Error) {
                void window.ctxBridge?.setUpdateStore({
                    status: UpdateStatusEnum.Idle,
                    errorType: null,
                    progress: null,
                });
            }
        };
    }, []);

    return updateStore;
};

const useCheckForUpdates = () => {
    const { createNotification } = useNotifications();

    return async () => {
        const result = await window.ctxBridge?.checkForUpdates().catch((err) => {
            logger.warn(`[Update] Check for update failed (${err})`);
            return false;
        });
        createNotification({
            text: result
                ? c('Info')
                      .t`A new version is being downloaded. Once the download completes, it will be available on next restart.`
                : c('Info').t`No new versions are available at the moment.`,
        });
    };
};

export const Update: FC = () => {
    const updateStore = useUpdateStore();
    const checkForUpdates = useCheckForUpdates();

    return (
        <SettingsPanel
            title={c('Label').t`Auto Update`}
            contentClassname="flex flex-column flex-nowrap pt-4 pb-2 gap-4"
        >
            <UpdateStatus updateStore={updateStore} onCheckForUpdates={checkForUpdates} />
            <Beta updateStore={updateStore} onCheckForUpdates={checkForUpdates} />
        </SettingsPanel>
    );
};

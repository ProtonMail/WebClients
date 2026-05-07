import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { UpdateStatus as UpdateStatusEnum } from '@proton/pass/types/desktop';
import type { UpdateStore } from '@proton/pass/types/desktop';
import { logger } from '@proton/pass/utils/logger';

import { SettingsPanel } from '../SettingsPanel';
import { Beta } from './Beta.desktop';
import { UpdateStatus } from './UpdateStatus.desktop';

const DEFAULT_UPDATE_STORE: UpdateStore = {
    distribution: 0,
    beta: false,
    status: UpdateStatusEnum.Idle,
    newVersion: null,
    progress: null,
};

const useUpdateStore = () => {
    const [updateStore, setUpdateStore] = useState<UpdateStore>(DEFAULT_UPDATE_STORE);

    useEffect(() => {
        void window.ctxBridge?.getUpdateStore().then(setUpdateStore);
        return window.ctxBridge?.onUpdateStoreChange(setUpdateStore);
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

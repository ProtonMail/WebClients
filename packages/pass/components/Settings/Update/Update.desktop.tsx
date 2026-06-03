import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { MaybeNull } from '@proton/pass/types';
import { UpdateErrorType, UpdateStatus as UpdateStatusEnum } from '@proton/pass/types/desktop';
import type { UpdateStore } from '@proton/pass/types/desktop';
import { logger } from '@proton/pass/utils/logger';

import { SettingsPanel } from '../SettingsPanel';
import { Beta } from './Beta.desktop';
import { UpdateStatus } from './UpdateStatus.desktop';

const DEFAULT_UPDATE_STORE = (currentVersion: string): UpdateStore => ({
    distribution: 0,
    beta: false,
    status: UpdateStatusEnum.Idle,
    errorType: null,
    currentVersion,
    newVersion: null,
    progress: null,
    mockDoDownloadError: false,
});

export const getErrorLabel = (type: MaybeNull<UpdateErrorType>): string => {
    if (type === null) return c('Error').t`Update failed`;
    const typeLabel = (() => {
        switch (type) {
            case UpdateErrorType.ManifestUnavailable:
                return c('Error').t`could not reach the update server`;
            case UpdateErrorType.ManifestInvalid:
                return c('Error').t`invalid update manifest`;
            case UpdateErrorType.DownloadFailed:
                return c('Error').t`could not download the update`;
            case UpdateErrorType.InstallFailed:
                return c('Error').t`could not install the update`;
        }
    })();
    return c('Error').t`Update failed (${typeLabel}).`;
};

const useUpdateStore = () => {
    const { config } = usePassCore();
    const [updateStore, setUpdateStore] = useState<UpdateStore>(DEFAULT_UPDATE_STORE(config.APP_VERSION));

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
    const { createNotification } = useNotifications();
    const updateStore = useUpdateStore();
    const checkForUpdates = useCheckForUpdates();

    useEffect(
        () => {
            if (updateStore.status === UpdateStatusEnum.Error) {
                createNotification({ text: getErrorLabel(updateStore.errorType), type: 'error' });
            }
        },
        // If errorType change but not status, it's ok to show a new notification
        // New check should first set status to pending so it should not occur anyway
        [updateStore.status, updateStore.errorType]
    );

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

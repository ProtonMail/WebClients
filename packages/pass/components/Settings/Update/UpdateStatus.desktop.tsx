import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Progress from '@proton/components/components/progress/Progress';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { UpdateStatus as UpdateStatusEnum } from '@proton/pass/types/desktop';
import type { UpdateStore } from '@proton/pass/types/desktop';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

const getStatusLabel = (status: UpdateStatusEnum, newVersion: string | null): string => {
    switch (status) {
        case UpdateStatusEnum.Checking:
            return c('Info').t`Checking for updates...`;
        case UpdateStatusEnum.Downloading:
            return newVersion ? c('Info').t`Downloading update ${newVersion}...` : c('Info').t`Downloading update...`;
        case UpdateStatusEnum.UpdateReady:
            return newVersion
                ? c('Info').t`Restart to apply update to ${newVersion}`
                : c('Info').t`Restart to apply update`;
        default:
            return c('Info').t`Up to date`;
    }
};

type Props = { updateStore: UpdateStore; onCheckForUpdates: () => Promise<void> };

export const UpdateStatus: FC<Props> = ({ updateStore: { status, newVersion, progress }, onCheckForUpdates }) => {
    const { config } = usePassCore();

    const busy = status === UpdateStatusEnum.Checking || status === UpdateStatusEnum.Downloading;
    const showStatus = status !== UpdateStatusEnum.Idle;
    const showProgress = status === UpdateStatusEnum.Downloading && progress !== null;
    const showLoader = status === UpdateStatusEnum.Downloading && progress === null;

    const handleRestartToUpdate = () => {
        void window.ctxBridge?.restartToUpdate();
    };

    return (
        <div>
            <div className="flex items-center justify-space-between mb-2">
                <div className="text-bold">
                    {PASS_APP_NAME} v{config.APP_VERSION}
                </div>
                {status !== UpdateStatusEnum.UpdateReady && (
                    <Button color="weak" shape="solid" size="small" loading={busy} onClick={onCheckForUpdates}>
                        {c('Action').t`Check for updates`}
                    </Button>
                )}
                {status === UpdateStatusEnum.UpdateReady && (
                    <Button color="norm" shape="solid" size="small" onClick={handleRestartToUpdate}>
                        {c('Action').t`Restart to update`}
                    </Button>
                )}
            </div>
            {showStatus && (
                <div className="color-weak text-sm mb-2 flex gap-2">
                    <span>{getStatusLabel(status, newVersion)}</span>
                    {showLoader && <CircleLoader />}
                </div>
            )}
            {showProgress && <Progress value={progress} className="mb-2" />}
        </div>
    );
};

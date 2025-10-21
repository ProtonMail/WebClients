import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Progress } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { ProgressBarStatus } from '../../../components/TransferManager/ProgressBar';
import { CloseButton } from '../buttons/closeButton';
import { MinimizeButton } from '../buttons/minimizeButton';
import { TransferManagerStatus, useTransferManagerState } from '../useTransferManagerState';

const PROGRESS_STATUS_BY_TRANSFER: Record<TransferManagerStatus, ProgressBarStatus> = {
    [TransferManagerStatus.Empty]: ProgressBarStatus.Disabled,
    [TransferManagerStatus.InProgress]: ProgressBarStatus.Running,
    [TransferManagerStatus.Failed]: ProgressBarStatus.Error,
    [TransferManagerStatus.Cancelled]: ProgressBarStatus.Disabled,
    [TransferManagerStatus.Finished]: ProgressBarStatus.Success,
};

const getProgressBarStatus = (transferState: TransferManagerStatus): ProgressBarStatus =>
    PROGRESS_STATUS_BY_TRANSFER[transferState];

type Props = {
    isMinimized: boolean;
    toggleMinimize: () => void;
    onClose: () => void;
};

export const TransferManagerHeader = ({ isMinimized, toggleMinimize, onClose }: Props) => {
    const { progressPercentage, status } = useTransferManagerState();
    const normalizedProgress = Math.min(100, Math.max(0, Math.round(progressPercentage)));
    const headerText = c('Info').t`In progress`;
    const progressText = c('Info').t`${normalizedProgress}% completed`;
    const cancelText = c('Action').t`Cancel all`;
    const pbStatus = getProgressBarStatus(status);

    return (
        <div className="flex w-full flex-column rounded-t-lg bg-weak px-4 py-4">
            <div className="flex flex-wrap items-start gap-3">
                <div className="flex min-w-0 flex-1 flex-column gap-1">
                    <div className="text-semibold">{headerText}</div>
                    <div className="color-weak text-sm">{progressText}</div>
                </div>
                <div className="flex items-center gap-2">
                    {status === TransferManagerStatus.InProgress && (
                        <Button type="button" shape="outline" color="weak" onClick={onClose}>
                            {cancelText}
                        </Button>
                    )}
                    <MinimizeButton onClick={toggleMinimize} isMinimized={isMinimized} />
                    {status !== TransferManagerStatus.InProgress && <CloseButton onClick={onClose} />}
                </div>
            </div>
            <div className="mt-3">
                <Progress
                    className={clsx(['transfers-manager-list-item-progress', `progress-bar--${pbStatus}`])}
                    value={normalizedProgress}
                    max={100}
                />
            </div>
        </div>
    );
};

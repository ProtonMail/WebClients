import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, Progress, useActiveBreakpoint } from '@proton/components';
import { UploadStatus } from '@proton/drive/modules/upload';
import clsx from '@proton/utils/clsx';

import { ProgressBarStatus } from '../../../components/TransferManager/ProgressBar';
import { BaseTransferStatus } from '../../../zustand/download/downloadManager.store';
import { CloseButton } from '../buttons/closeButton';
import { MinimizeButton } from '../buttons/minimizeButton';
import { useTransferManagerActions } from '../useTransferManagerActions';
import { TransferManagerStatus, useTransferManagerState } from '../useTransferManagerState';

const PROGRESS_STATUS_BY_TRANSFER: Record<TransferManagerStatus, ProgressBarStatus> = {
    [TransferManagerStatus.Empty]: ProgressBarStatus.Disabled,
    [TransferManagerStatus.InProgress]: ProgressBarStatus.Running,
    [TransferManagerStatus.Failed]: ProgressBarStatus.Error,
    [TransferManagerStatus.Cancelled]: ProgressBarStatus.Success,
    [TransferManagerStatus.Finished]: ProgressBarStatus.Success,
};

const getProgressBarStatus = (transferState: TransferManagerStatus): ProgressBarStatus =>
    PROGRESS_STATUS_BY_TRANSFER[transferState];

type Props = {
    isMinimized: boolean;
    toggleMinimize: () => void;
    onClose: () => void;
};

const getHeaderTextFromStatus = (status: TransferManagerStatus): string => {
    switch (status) {
        case TransferManagerStatus.InProgress:
            return c('Info').t`In progress`;
        case TransferManagerStatus.Failed:
            return c('Info').t`Some items failed`;
        default:
            return c('Info').t`Done`;
    }
};

export const TransferManagerHeader = ({ isMinimized, toggleMinimize, onClose }: Props) => {
    const { progressPercentage, status, items } = useTransferManagerState();
    const { cancelAll, confirmModal, retryFailedTransfers } = useTransferManagerActions();
    const headerText = getHeaderTextFromStatus(status);
    const normalizedProgress = Math.min(100, Math.max(0, Math.round(progressPercentage)));
    const progressText = c('Info').t`${normalizedProgress}% completed`;
    const cancelText = c('Action').t`Cancel all`;
    const retryAllText = c('Action').t`Retry failed items`;
    const pbStatus = getProgressBarStatus(status);
    const completedItems = items.filter(
        (item) => item.status === BaseTransferStatus.Finished || item.status === UploadStatus.PhotosDuplicate
    );
    const completedText = c('Info').t`${completedItems.length} of ${items.length} transfers completed`;
    const { viewportWidth } = useActiveBreakpoint();
    return (
        <div
            className="flex w-full flex-column rounded-t-lg bg-weak px-4 py-4"
            data-testid="drive-transfers-manager:header"
        >
            <div className="flex flex-wrap items-start gap-3">
                <div className="flex min-w-0 flex-1 flex-column gap-1">
                    <div className="text-semibold" data-testid="transfer-manager:header:status-text">
                        {headerText}
                    </div>
                    {status === TransferManagerStatus.InProgress && (
                        <div className="color-weak text-sm" data-testid="transfer-manager:header:progress-text">
                            {progressText}
                        </div>
                    )}
                    {status !== TransferManagerStatus.InProgress && status !== TransferManagerStatus.Empty && (
                        <div className="color-weak text-sm" data-testid="transfer-manager:header:progress-text">
                            {completedText}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {status === TransferManagerStatus.InProgress && (
                        <Button
                            type="button"
                            shape="outline"
                            color="weak"
                            onClick={() => cancelAll(items)}
                            data-testid="drive-transfers-manager:header-controls-cancel"
                        >
                            {cancelText}
                        </Button>
                    )}
                    {status === TransferManagerStatus.Failed && (
                        <Button
                            icon={viewportWidth.xsmall}
                            type="button"
                            shape="outline"
                            color="weak"
                            onClick={() => retryFailedTransfers(items)}
                            data-testid="drive-transfers-manager:header-controls-retry-failed"
                        >
                            {viewportWidth.xsmall ? (
                                <Icon name="arrow-rotate-right" className="icon-size-4.5" />
                            ) : (
                                retryAllText
                            )}
                        </Button>
                    )}
                    <MinimizeButton onClick={toggleMinimize} isMinimized={isMinimized} />
                    {status !== TransferManagerStatus.InProgress && <CloseButton onClick={onClose} />}
                </div>
            </div>
            <div>
                <Progress
                    className={clsx([`progress-bar--${pbStatus}`, 'tm-progress'])}
                    value={normalizedProgress}
                    max={100}
                />
            </div>
            {confirmModal}
        </div>
    );
};

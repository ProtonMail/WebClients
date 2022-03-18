import { useLoading } from '@proton/components';
import { c } from 'ttag';

import { TransferType, Upload } from '@proton/shared/lib/interfaces/drive/transfer';
import {
    isTransferPaused,
    isTransferFinished,
    isTransferFailed,
    isTransferFinalizing,
    isTransferOngoing,
} from '../../utils/transfer';
import { TransferManagerButtonProps, TransferProps } from './interfaces';
import Buttons from './Buttons';
import useTransferControls from './useTransferControls';

function TransferControls<T extends TransferType>({ transfer, type }: TransferProps<T>) {
    const transferControls = useTransferControls();
    const [pauseInProgress, withPauseInProgress] = useLoading();
    const isFinished = isTransferFinished(transfer);
    const isFailed = isTransferFailed(transfer);
    const isFinalizing = isTransferFinalizing(transfer);

    const isPauseResumeAvailable = isTransferOngoing(transfer);
    const isRestartAvailable = isFailed;

    const isTransferWithChildrenFinished = (upload: Upload) => {
        if (!isTransferFinished(upload)) {
            return false;
        }
        if (upload.files?.some((transfer) => !isTransferFinished(transfer))) {
            return false;
        }
        if (upload.folders?.some((transfer) => !isTransferWithChildrenFinished(transfer))) {
            return false;
        }
        return true;
    };
    // Do not show clear button for uploading folders which still have any
    // children in progress as that would lead to some edge cases that
    // parent with its children is removed from transfer manager but some
    // ongoing transfers are still finishing up.
    const isClearAvailable = type === TransferType.Download || isTransferWithChildrenFinished(transfer as Upload);

    const pauseText = type === TransferType.Download ? c('Action').t`Pause download` : c('Action').t`Pause upload`;
    const resumeText = type === TransferType.Download ? c('Action').t`Resume download` : c('Action').t`Resume upload`;
    const cancelText = type === TransferType.Download ? c('Action').t`Cancel download` : c('Action').t`Cancel upload`;
    const restartText =
        type === TransferType.Download ? c('Action').t`Restart download` : c('Action').t`Restart upload`;
    const removeText = c('Action').t`Remove from this list`;

    const getButtons = () => {
        const buttons: TransferManagerButtonProps[] = [];
        if (isPauseResumeAvailable) {
            buttons.push({
                onClick: () => withPauseInProgress(transferControls.togglePause(transfer, type)),
                disabled: pauseInProgress,
                title: isTransferPaused(transfer) ? resumeText : pauseText,
                iconName: isTransferPaused(transfer) ? 'play' : 'pause',
            });
        }

        if (isRestartAvailable) {
            buttons.push({
                onClick: () => transferControls.restart(transfer, type),
                title: restartText,
                iconName: 'arrow-rotate-right',
            });
        }

        if (isClearAvailable) {
            buttons.push({
                onClick: () => transferControls.cancel(transfer, type),
                title: isFinished ? removeText : cancelText,
                disabled: isFinalizing,
                iconName: isFinished ? 'broom' : 'xmark',
            });
        }

        return buttons;
    };

    return <Buttons className="transfers-manager-list-item-controls" buttons={getButtons()} />;
}

export default TransferControls;

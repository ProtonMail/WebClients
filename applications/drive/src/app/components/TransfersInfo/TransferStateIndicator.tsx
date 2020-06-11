import React from 'react';
import { TransferState, Upload, Download } from '../../interfaces/transfer';
import { Icon, classnames } from 'react-components';
import { c } from 'ttag';
import { isTransferDone, isTransferFailed, isTransferPaused } from '../../utils/transfer';

interface Props {
    transfer: Upload | Download;
    percentageDone: number;
}

const TransferStateIndicator = ({ transfer, percentageDone }: Props) => {
    const statusInfo = {
        [TransferState.Initializing]: {
            text: c('Info').t`Initializing`
        },
        [TransferState.Pending]: {
            text: c('Info').t`Queued`
        },
        [TransferState.Done]: {
            text: c('Info').t`Completed`,
            icon: 'on'
        },
        [TransferState.Progress]: {
            text: `${percentageDone}%`
        },
        [TransferState.Error]: {
            text: c('Info').t`Error`,
            icon: 'attention'
        },
        [TransferState.Canceled]: {
            text: c('Info').t`Canceled`,
            icon: 'off'
        },
        [TransferState.Paused]: {
            text: c('Info').t`Paused`,
            icon: 'pause'
        }
    }[transfer.state];

    return (
        <strong
            className={classnames([
                'pd-transfers-listItemTransferStateIndicator flex-item-fluid flex flex-nowrap flex-justify-end flex-items-center',
                isTransferDone(transfer) && 'color-global-success',
                isTransferFailed(transfer) && 'color-global-warning',
                isTransferPaused(transfer) && 'color-global-attention'
            ])}
            aria-atomic="true"
            aria-live="polite"
            id={transfer.id}
        >
            {statusInfo.icon && <Icon name={statusInfo.icon} className="mr0-25 flex-item-noshrink" />}
            {statusInfo.text}
        </strong>
    );
};

export default TransferStateIndicator;

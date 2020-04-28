import React from 'react';
import { TransferState } from '../../interfaces/transfer';
import { Icon, classnames } from 'react-components';
import { c } from 'ttag';
import { Download } from '../downloads/DownloadProvider';
import { Upload } from '../uploads/UploadProvider';

interface Props {
    transfer: Upload | Download;
    percentageDone: number;
}

const TransferStateIndicator = ({ transfer: { id, state }, percentageDone }: Props) => {
    const isSuccess = state === TransferState.Done;
    const isError = state === TransferState.Canceled || state === TransferState.Error;
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
        }
    }[state];

    return (
        <strong
            className={classnames([
                'pd-transfers-listItemTransferStateIndicator flex-item-fluid flex flex-nowrap flex-justify-end flex-items-center',
                isSuccess && 'color-global-success',
                isError && 'color-global-warning'
            ])}
            aria-atomic="true"
            aria-live="polite"
            id={id}
        >
            {statusInfo.icon && <Icon name={statusInfo.icon} className="mr0-25 flex-item-noshrink" />}
            {statusInfo.text}
        </strong>
    );
};

export default TransferStateIndicator;

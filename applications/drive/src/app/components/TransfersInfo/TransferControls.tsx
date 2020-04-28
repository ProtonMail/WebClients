import React from 'react';
import { Download, useDownloadProvider } from '../downloads/DownloadProvider';
import { Icon } from 'react-components';
import { TransferState } from '../../interfaces/transfer';
import { c } from 'ttag';
import { Upload, useUploadProvider } from '../uploads/UploadProvider';
import { TransferType } from './Transfer';

type Props =
    | {
          transfer: Download;
          type: TransferType.Download;
      }
    | {
          transfer: Upload;
          type: TransferType.Upload;
      };

function TransferControls({ transfer, type }: Props) {
    const { cancelDownload, removeDownload } = useDownloadProvider();
    const { removeUpload } = useUploadProvider();
    const isFinished = [TransferState.Done, TransferState.Error, TransferState.Canceled].includes(transfer.state);

    const handleClick = () => {
        switch (type) {
            case TransferType.Download:
                if (isFinished) {
                    return removeDownload(transfer.id);
                }
                return cancelDownload(transfer.id);
            case TransferType.Upload:
                if (isFinished) {
                    return removeUpload(transfer.id);
                }
        }
    };

    return (
        <span className="pd-transfers-controls flex-item-fluid flex flex-nowrap flex-justify-end">
            <button
                type="button"
                onClick={handleClick}
                className="pd-transfers-controlButton pm-button--info pm-button--for-icon rounded50 flex-item-noshrink flex"
                title={isFinished ? c('Action').t`Remove from this list` : c('Action').t`Cancel transfer`}
            >
                <Icon size={12} name="off" />
            </button>
        </span>
    );
}

export default TransferControls;

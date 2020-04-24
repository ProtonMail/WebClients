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
        <button
            type="button"
            onClick={handleClick}
            className="h100 inline-flex rounded50 flex-item-noshrink p0-25 bg-black opacity-50"
            title={isFinished ? c('Action').t`Remove` : c('Action').t`Cancel`}
        >
            <Icon size={12} className="color-white" name="off" />
        </button>
    );
}

export default TransferControls;

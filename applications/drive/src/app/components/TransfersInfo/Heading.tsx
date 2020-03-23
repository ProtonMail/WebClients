import React from 'react';
import { c, msgid } from 'ttag';
import { Icon, classnames } from 'react-components';
import { Download } from '../downloads/DownloadProvider';
import { Upload } from '../uploads/UploadProvider';
import { TransferState } from '../../interfaces/transfer';

const isTransferActive = ({ state }: Upload | Download) =>
    state === TransferState.Pending || state === TransferState.Progress || state === TransferState.Initializing;
const isTransferFailed = ({ state }: Upload | Download) => state === TransferState.Error;

interface Props {
    downloads: Download[];
    uploads: Upload[];
    minimized: boolean;
    onToggleMinimize: () => void;
    onClose: () => void;
}

const Heading = ({ downloads, uploads, onClose, onToggleMinimize, minimized = false }: Props) => {
    const activeUploads = uploads.filter(isTransferActive);
    const activeDownloads = downloads.filter(isTransferActive);
    const failedTransfers = downloads.filter(isTransferFailed);

    const getHeadingText = () => {
        let headingText = '';
        const transferCount = uploads.length + downloads.length;
        const activeCount = activeUploads.length + activeDownloads.length;
        const errorCount = failedTransfers.length;

        if (uploads.length && downloads.length) {
            headingText =
                activeUploads.length || activeDownloads.length
                    ? c('Info').ngettext(
                          msgid`Transferring ${activeCount} file`,
                          `Transferring ${activeCount} files`,
                          activeCount
                      )
                    : c('Info').ngettext(
                          msgid`Transferred ${transferCount} file`,
                          `Transferred ${transferCount} files`,
                          transferCount
                      );
        } else if (downloads.length) {
            headingText = activeDownloads.length
                ? c('Info').ngettext(
                      msgid`Downloading ${activeCount} file`,
                      `Downloading ${activeCount} files`,
                      activeCount
                  )
                : c('Info').ngettext(
                      msgid`Downloaded ${transferCount} file`,
                      `Downloaded ${transferCount} files`,
                      transferCount
                  );
        } else {
            headingText = activeUploads.length
                ? c('Info').ngettext(
                      msgid`Uploading ${activeCount} file`,
                      `Uploading ${activeCount} files`,
                      activeCount
                  )
                : c('Info').ngettext(
                      msgid`Uploaded ${transferCount} file`,
                      `Uploaded ${transferCount} files`,
                      transferCount
                  );
        }

        if (errorCount) {
            headingText += ` (${c('Info').ngettext(msgid`${errorCount} error`, `${errorCount} errors`, errorCount)})`;
        }

        return headingText;
    };

    const minimizeTitle = c('Action').t`Minimize transfers`;
    const closeTitle = c('Action').t`Close transfers`;

    return (
        <div className="pd-transfers-heading pt0-5 pb0-5 pl1 pr1 flex flex-spacebetween flex-items-center">
            <span className="strong flex">{getHeadingText()}</span>

            <div className="flex">
                <button
                    className="color-global-light"
                    onClick={onToggleMinimize}
                    aria-expanded={!minimized}
                    title={minimizeTitle}
                >
                    <Icon className={classnames([minimized && 'rotateX-180'])} name="caret" />
                    <span className="sr-only">{minimizeTitle}</span>
                </button>

                <button
                    disabled={activeUploads.length > 0 || activeDownloads.length > 0}
                    className="color-global-light ml0-5"
                    onClick={onClose}
                    title={closeTitle}
                >
                    <Icon name="off" size={12} />
                    <span className="sr-only">{closeTitle}</span>
                </button>
            </div>
        </div>
    );
};

export default Heading;

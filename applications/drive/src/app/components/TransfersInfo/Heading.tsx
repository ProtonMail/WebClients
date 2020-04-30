import React, { useRef } from 'react';
import { c, msgid } from 'ttag';
import { Icon, Tooltip, classnames } from 'react-components';
import { Download } from '../downloads/DownloadProvider';
import { Upload } from '../uploads/UploadProvider';
import { TransferState } from '../../interfaces/transfer';

const isTransferActive = ({ state }: Upload | Download) =>
    state === TransferState.Pending || state === TransferState.Progress || state === TransferState.Initializing;
const isTransferDone = ({ state }: Upload | Download) => state === TransferState.Done;
const isTransferFailed = ({ state }: Upload | Download) => state === TransferState.Error;
const isTransferCanceled = ({ state }: Upload | Download) => state === TransferState.Canceled;

interface Props {
    downloads: Download[];
    uploads: Upload[];
    minimized: boolean;
    onToggleMinimize: () => void;
    onClose: () => void;
}

const Heading = ({ downloads, uploads, onClose, onToggleMinimize, minimized = false }: Props) => {
    const minimizeRef = useRef<HTMLButtonElement>(null);
    const transfers = [...downloads, ...uploads];
    const activeUploads = uploads.filter(isTransferActive);
    const activeDownloads = downloads.filter(isTransferActive);
    const doneTransfers = transfers.filter(isTransferDone);
    const failedTransfers = transfers.filter(isTransferFailed);
    const canceledTransfers = transfers.filter(isTransferCanceled);

    const getHeadingText = () => {
        let headingText = '';
        const activeCount = activeUploads.length + activeDownloads.length;
        const errorCount = failedTransfers.length;
        const canceledCount = canceledTransfers.length;
        const doneCount = doneTransfers.length;

        if (uploads.length && downloads.length) {
            headingText =
                activeUploads.length || activeDownloads.length
                    ? c('Info').ngettext(
                          msgid`Transferring ${activeCount} file`,
                          `Transferring ${activeCount} files`,
                          activeCount
                      )
                    : c('Info').ngettext(
                          msgid`Transferred ${doneCount} file`,
                          `Transferred ${doneCount} files`,
                          doneCount
                      );
        } else if (downloads.length) {
            headingText = activeDownloads.length
                ? c('Info').ngettext(
                      msgid`Downloading ${activeCount} file`,
                      `Downloading ${activeCount} files`,
                      activeCount
                  )
                : c('Info').ngettext(msgid`Downloaded ${doneCount} file`, `Downloaded ${doneCount} files`, doneCount);
        } else {
            headingText = activeUploads.length
                ? c('Info').ngettext(
                      msgid`Uploading ${activeCount} file`,
                      `Uploading ${activeCount} files`,
                      activeCount
                  )
                : c('Info').ngettext(msgid`Uploaded ${doneCount} file`, `Uploaded ${doneCount} files`, doneCount);
        }

        if (canceledCount) {
            headingText += `, ${c('Info').t`${canceledCount} canceled`}`;
        }

        if (errorCount) {
            headingText += `, ${c('Info').ngettext(msgid`${errorCount} error`, `${errorCount} errors`, errorCount)}`;
        }

        return headingText;
    };

    const minMaxTitle = minimized ? c('Action').t`Maximize transfers` : c('Action').t`Minimize transfers`;
    const closeTitle = c('Action').t`Close transfers`;

    return (
        <div className="pd-transfers-heading flex flex-items-center flex-nowrap pl0-5 pr0-5 color-global-light">
            <div className="flex-item-fluid p0-5" onClick={minimized ? onToggleMinimize : undefined}>
                {getHeadingText()}
            </div>
            <Tooltip title={minMaxTitle} className="pd-transfers-headingTooltip flex-item-noshrink flex">
                <button
                    ref={minimizeRef}
                    type="button"
                    className="pd-transfers-headingButton p0-5 flex"
                    onClick={() => {
                        minimizeRef.current?.blur();
                        onToggleMinimize();
                    }}
                    aria-expanded={!minimized}
                >
                    <Icon className={classnames([minimized && 'rotateX-180'])} name="minimize" />
                    <span className="sr-only">{minMaxTitle}</span>
                </button>
            </Tooltip>
            <Tooltip
                title={closeTitle}
                className={classnames([
                    'pd-transfers-headingTooltip flex-item-noshrink flex',
                    (activeUploads.length > 0 || activeDownloads.length > 0) &&
                        'pd-transfers-headingTooltip--isDisabled'
                ])}
            >
                <button
                    type="button"
                    disabled={activeUploads.length > 0 || activeDownloads.length > 0}
                    className="pd-transfers-headingButton flex p0-5"
                    onClick={onClose}
                >
                    <Icon name="off" />
                    <span className="sr-only">{closeTitle}</span>
                </button>
            </Tooltip>
        </div>
    );
};

export default Heading;

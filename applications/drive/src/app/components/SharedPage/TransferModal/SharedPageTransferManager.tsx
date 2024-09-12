import { useCallback, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { FileIcon, Icon, Tooltip, useToggle } from '@proton/components';
import { isProtonUserFromCookie } from '@proton/components/helpers/protonUserCookie';
import { useActiveBreakpoint } from '@proton/components/hooks';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_PRICING_PAGE } from '@proton/shared/lib/drive/urls';
import clsx from '@proton/utils/clsx';

import type { DecryptedLink } from '../../../store';
import { useDownload } from '../../../store';
import { getPercentageFormatter } from '../../../utils/intl/numberFormatter';
import { isTransferActive } from '../../../utils/transfer';
import type { Download } from '../../TransferManager/transfer';
import { TransferState } from '../../TransferManager/transfer';
import ReportVirusButton from './ReportVirusButton';
import Spinner from './Spinner';

import './SharedPageTransferManager.scss';

interface Props {
    rootItem: DecryptedLink;
}

const ScanIssueContent = ({
    isDownloadAll,
    nbFile,
    rootItem,
    mimeType,
}: {
    isDownloadAll: boolean;
    nbFile: number;
    rootItem: DecryptedLink;
    mimeType: string;
}) => {
    const { downloads, resumeDownloads, cancelDownloads } = useDownload();
    const { viewportWidth } = useActiveBreakpoint();

    const currentDownload = downloads[0];
    const handleContinue = () => {
        resumeDownloads(currentDownload.id);
    };

    const handleCancel = () => {
        cancelDownloads(currentDownload.id);
    };

    let comment = `File "${currentDownload.meta.filename}" is detected as potential malware.`;
    if (currentDownload.scanIssueError?.message) {
        comment = `${comment} Message from scanning is "${currentDownload.scanIssueError?.message}"`;
    }

    const buttonLabel = viewportWidth['<=small'] ? c('Info').t`Download anyway` : c('Info').t`Download`;
    return (
        <div className="flex flex-1 sm:flex-row flex-column flex-nowrap items-stretch sm:items-center justify-space-between gap-2">
            <div className="flex flex-row gap-2 items-center flex-nowrap">
                <FileIcon size={8} mimeType={mimeType} />
                <div className="text-ellipsis overflow-hidden">
                    {isDownloadAll
                        ? c('Info').t`Downloading all encrypted files`
                        : c('Info').ngettext(
                              msgid`${nbFile} encrypted file...`,
                              `${nbFile} encrypted files...`,
                              nbFile
                          )}
                </div>
            </div>
            <div className="flex flex-column-reverse flex-column sm:flex-row flex-nowrap gap-2">
                <Button
                    shape="ghost"
                    color="norm"
                    size="small"
                    data-testid="share-transfer-manager:download-anyway"
                    onClick={handleContinue}
                >
                    {buttonLabel}
                </Button>
                <ReportVirusButton
                    className="text-nowrap"
                    linkInfo={rootItem}
                    comment={comment}
                    reportCallback={handleCancel}
                />
            </div>
        </div>
    );
};

const getHeaderText = ({
    transferState,
    percentageValue,
    currentDownload,
}: {
    transferState: TransferState;
    percentageValue: string;
    currentDownload?: Download;
}) => {
    switch (transferState) {
        case TransferState.Error:
        case TransferState.NetworkError:
            return (
                <>
                    <Icon size={6} name="exclamation-circle-filled" className="color-danger" />
                    <span className="text-bold">{c('Info').t`Download failed`}</span>
                </>
            );
        case TransferState.Canceled:
            return (
                <>
                    <Icon size={6} name="minus-circle-filled" className="color-weak" />
                    <span className="text-bold">{c('Info').t`Download canceled`}</span>
                </>
            );
        case TransferState.Progress:
            return (
                <>
                    <Spinner />
                    <span className="text-bold">{c('Label').jt`Downloading ${percentageValue}`}</span>
                </>
            );
        case TransferState.ScanIssue:
            return (
                <>
                    <Icon size={6} name="exclamation-circle-filled" className="color-danger" />
                    <span className="text-bold">
                        {currentDownload?.scanIssueError?.message || c('Label').jt`This file is potentially infected`}
                    </span>
                </>
            );
        default:
            return (
                <>
                    <Icon size={6} name="checkmark-circle-filled" className="color-success" />
                    <span className="text-bold">{c('Info').t`Download finished`}</span>
                </>
            );
    }
};

const getContentText = ({
    transferState,
    onRetry,
    nbFile,
    isDownloadAll,
    rootItem,
    mimeType,
}: {
    transferState: TransferState;
    onRetry: () => void;
    nbFile: number;
    isDownloadAll: boolean;
    rootItem: DecryptedLink;
    mimeType: string;
}) => {
    switch (transferState) {
        case TransferState.Error:
        case TransferState.NetworkError:
            return (
                <>
                    <FileIcon size={8} mimeType={mimeType} />
                    <div className="flex flex-1 items-center justify-space-between">
                        <span>{c('Info').t`Something went wrong...`}</span>
                        <Button shape="ghost" color="norm" size="small" onClick={onRetry}>{c('Info')
                            .t`Retry now`}</Button>
                    </div>
                </>
            );
        case TransferState.ScanIssue:
            return (
                <ScanIssueContent
                    isDownloadAll={isDownloadAll}
                    nbFile={nbFile}
                    rootItem={rootItem}
                    mimeType={mimeType}
                />
            );
        case TransferState.Canceled:
            return (
                <>
                    <FileIcon size={8} mimeType={mimeType} />
                    <div className="flex flex-1 items-center justify-space-between">
                        <span>
                            {isDownloadAll
                                ? c('Info').t`All encrypted files`
                                : c('Info').ngettext(
                                      msgid`${nbFile} encrypted file`,
                                      `${nbFile} encrypted file`,
                                      nbFile
                                  )}
                        </span>
                        <Button shape="ghost" color="norm" size="small" onClick={onRetry}>{c('Info')
                            .t`Retry now`}</Button>
                    </div>
                </>
            );
        case TransferState.Progress:
            return (
                <>
                    <FileIcon size={8} mimeType={mimeType} />
                    <span>
                        {isDownloadAll
                            ? c('Info').t`Downloading all encrypted files`
                            : c('Info').ngettext(
                                  msgid`${nbFile} encrypted file...`,
                                  `${nbFile} encrypted files...`,
                                  nbFile
                              )}
                        {}
                    </span>
                </>
            );
        default:
            return (
                <>
                    <FileIcon size={8} mimeType={mimeType} />
                    <span>
                        {isDownloadAll
                            ? c('Info').t`Securely downloaded all encrypted files`
                            : c('Info').ngettext(
                                  msgid`Securely downloaded ${nbFile} file`,
                                  `Securely downloaded ${nbFile} files`,
                                  nbFile
                              )}
                    </span>
                </>
            );
    }
};

const getNonProtonUserContentText = ({
    transferState,
    nbFile,
    isDownloadAll,
}: {
    transferState: TransferState;
    nbFile: number;
    isDownloadAll: boolean;
}) => {
    if (transferState === TransferState.Progress) {
        return (
            <>
                <h4 className="text-bold">{c('Info').t`Your download is in progress`}</h4>
                <p className="m-0 mt-1 ">
                    {c('Info')
                        .t`In the meantime, sign-up for your own ${DRIVE_APP_NAME} account and protect your data with end-to-end encryption and share it securely.`}
                </p>
            </>
        );
    }
    return (
        <>
            <h4 className="text-bold">
                {isDownloadAll
                    ? c('Info').t`Securely downloaded all files`
                    : c('Info').ngettext(
                          msgid`Securely downloaded ${nbFile} file`,
                          `Securely downloaded ${nbFile} files`,
                          nbFile
                      )}
            </h4>
            <p className="m-0 mt-1 ">
                {c('Info')
                    .t`Sign-up for your own ${DRIVE_APP_NAME} account and protect your data with end-to-end encryption and share it securely.`}
            </p>
        </>
    );
};

const ManagerContainer = ({ transferState, children }: { transferState: TransferState; children: React.ReactNode }) => {
    return (
        <div
            className={clsx(
                'share-transfer-manager fixed bottom-0 right-0 border border-primary w-full md:min-w-custom max-w-custom m-0 md:mr-10 overflow-hidden',
                transferState === TransferState.Canceled && 'share-transfer-manager--canceled border-norm',
                (transferState === TransferState.Error ||
                    transferState === TransferState.NetworkError ||
                    transferState === TransferState.ScanIssue) &&
                    'share-transfer-manager--failed border-danger'
            )}
            style={{ '--min-w-custom': '27.5em', '--max-w-custom': '33.25em' }}
            id="share-page-transfer-manager"
        >
            {children}
        </div>
    );
};

interface ManagerHeaderProps {
    transferState: TransferState;
    isExpanded: boolean;
    percentageValue: string;
    onMinimized: () => void;
    clearDownloads: () => void;
    currentDownload?: Download;
}
const ManagerHeader = ({
    transferState,
    isExpanded,
    percentageValue,
    onMinimized,
    clearDownloads,
    currentDownload,
}: ManagerHeaderProps) => {
    const isInProgress = transferState === TransferState.Progress;
    return isInProgress ? (
        <button
            className="share-transfer-manager-header w-full flex items-center justify-space-between"
            onClick={onMinimized}
        >
            <div className="flex items-center gap-2 pl-3" data-testid="share-transfers-manager:header">
                {getHeaderText({ transferState, percentageValue })}
            </div>
            <Tooltip title={isExpanded ? c('Action').t`Minimize` : c('Action').t`Maximize`}>
                <ButtonLike
                    className="pointer-events-none"
                    as="span"
                    icon
                    shape="ghost"
                    data-testid="share-transfer-manager:minimize-maximize"
                    onClick={onMinimized}
                >
                    <Icon
                        name={isExpanded ? 'chevron-down' : 'chevron-up'}
                        alt={isExpanded ? c('Action').t`Minimize` : c('Action').t`Maximize`}
                    />
                </ButtonLike>
            </Tooltip>
        </button>
    ) : (
        <div className="share-transfer-manager-header w-full flex flex-nowrap items-center justify-space-between">
            <div className="flex flex-nowrap items-center gap-2 pl-3" data-testid="share-transfers-manager:header">
                {getHeaderText({ transferState, percentageValue, currentDownload })}
            </div>
            <Tooltip title={c('Action').t`Close`} onClick={clearDownloads}>
                <Button icon shape="ghost" data-testid="share-transfer-manager:close">
                    <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                </Button>
            </Tooltip>
        </div>
    );
};

const SharedPageTransferManager = ({ rootItem }: Props) => {
    const [downloadedSize, setDownloadedSize] = useState<number>(0);
    const [totalSize, setTotalSize] = useState<number>(0);
    const [nbFile, setNbFile] = useState<number>(0);

    const isProtonUser = isProtonUserFromCookie();
    const { downloads, getDownloadsLinksProgresses, restartDownloads, clearDownloads } = useDownload();

    const isDownloadAll = downloads[0]?.links[0].linkId === rootItem.linkId && !rootItem.isFile;

    const updateProgress = useCallback(() => {
        const downloadLinksProgresses = getDownloadsLinksProgresses();

        // In case of "Download all" (which has no selected item) from folder
        // share, the top folder is included in progresses as well which needs
        // to be excluded to not count progress twice. But in case of file
        // share the root item must be included otherwise no progress would
        // be tracked.
        const progressInfo = Object.entries(downloadLinksProgresses).reduce(
            (previousValue, [linkId, { progress, total }]) => {
                if (
                    (linkId !== rootItem.linkId || Object.keys(downloadLinksProgresses).length === 1) &&
                    total !== undefined
                ) {
                    return {
                        progress: previousValue.progress + progress,
                        total: previousValue.total + total!,
                    };
                } else {
                    return previousValue;
                }
            },
            {
                progress: 0,
                total: 0,
            }
        );
        setDownloadedSize(progressInfo.progress);
        setTotalSize(progressInfo.total);
    }, [getDownloadsLinksProgresses, rootItem.linkId]);

    // Transfer manager can be minimized only when it is in progress.
    // When user clicks on it, but it is always expanded again when its done
    const { state: expanded, toggle: toggleExpanded } = useToggle(true);

    // Enrich link date with download progress. Downloads changes only when
    // status changes, not the progress, so if download is active, it needs
    // to run in interval until download is finished.
    useEffect(() => {
        updateProgress();

        if (!downloads.some(isTransferActive)) {
            // Progresses are not handled by state and might be updated
            // without notifying a bit after downloads state is changed.
            const id = setTimeout(updateProgress, 500);
            return () => {
                clearTimeout(id);
            };
        }

        const id = setInterval(updateProgress, 500);
        return () => {
            clearInterval(id);
        };
    }, [downloads, updateProgress]);

    useEffect(() => {
        const currentDownload = downloads[0];
        if (currentDownload) {
            setNbFile(currentDownload.links.length);
        }
    }, [downloads]);

    const percentageValue = totalSize !== 0 ? Math.round((100 * downloadedSize) / totalSize) / 100 : 0;

    const currentDownload = downloads[0];
    const isInProgress = currentDownload?.state === TransferState.Progress;
    const isDone = currentDownload?.state === TransferState.Done;

    if (!nbFile || !currentDownload) {
        return null;
    }

    return (
        <ManagerContainer transferState={currentDownload.state}>
            <ManagerHeader
                transferState={currentDownload.state}
                isExpanded={expanded}
                percentageValue={getPercentageFormatter().format(percentageValue)}
                clearDownloads={clearDownloads}
                onMinimized={toggleExpanded}
                currentDownload={downloads[0]}
            />
            <div
                className={clsx(
                    'share-transfer-manager-content',
                    !expanded && isInProgress && 'share-transfer-manager-content--minimized'
                )}
            >
                {!isProtonUser && (isInProgress || isDone) ? (
                    <div className="flex flex-nowrap items-center gap-8 px-4 py-5">
                        <div className="flex-1">
                            {getNonProtonUserContentText({
                                transferState: currentDownload.state,
                                nbFile,
                                isDownloadAll,
                            })}
                        </div>
                        <ButtonLike as="a" href={DRIVE_PRICING_PAGE} target="_blank" color="norm" shape="outline">{c(
                            'Action'
                        ).t`Get Started`}</ButtonLike>
                    </div>
                ) : (
                    <div className="px-4 py-5 flex items-center gap-2" data-testid="share-transfer-manager:content">
                        {getContentText({
                            transferState: currentDownload.state,
                            onRetry: () => restartDownloads(currentDownload.id),
                            nbFile,
                            isDownloadAll,
                            rootItem,
                            mimeType: currentDownload.meta.mimeType,
                        })}
                    </div>
                )}
            </div>
        </ManagerContainer>
    );
};

export default SharedPageTransferManager;

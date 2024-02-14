import { useCallback, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { FileIcon, Icon, Tooltip } from '@proton/components/components';
import { IS_PROTON_USER_COOKIE_NAME } from '@proton/components/hooks/useIsProtonUserCookie';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_PRICING_PAGE } from '@proton/shared/lib/drive/urls';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import clsx from '@proton/utils/clsx';

import { DecryptedLink, useDownload } from '../../../store';
import { getPercentageFormatter } from '../../../utils/intl/numberFormatter';
import { isTransferActive } from '../../../utils/transfer';
import { TransferState } from '../../TransferManager/transfer';
import Spinner from './Spinner';

import './SharedPageTransferManager.scss';

interface Props {
    rootItem: DecryptedLink;
}

const getHeaderText = ({
    transferState,
    percentageValue,
}: {
    transferState: TransferState;
    percentageValue: string;
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
        default:
            return (
                <>
                    <Icon size={6} name="checkmark-circle-filled" className="color-success" />
                    <span className="text-bold">{c('Info').t`Download ready`}</span>
                </>
            );
    }
};

const getContentText = ({
    transferState,
    onRetry,
    nbFile,
    isDownloadAll,
}: {
    transferState: TransferState;
    onRetry: () => void;
    nbFile: number;
    isDownloadAll: boolean;
}) => {
    switch (transferState) {
        case TransferState.Error:
        case TransferState.NetworkError:
            return (
                <div className="flex flex-1 items-center justify-space-between">
                    <span>{c('Info').t`Something went wrong...`}</span>
                    <Button shape="ghost" color="norm" size="small" onClick={onRetry}>{c('Info').t`Retry now`}</Button>
                </div>
            );
        case TransferState.Canceled:
            return (
                <div className="flex flex-1 items-center justify-space-between">
                    <span>
                        {isDownloadAll
                            ? c('Info').t`All encrypted files`
                            : c('Info').ngettext(msgid`${nbFile} encrypted file`, `${nbFile} encrypted file.`, nbFile)}
                    </span>
                    <Button shape="ghost" color="norm" size="small" onClick={onRetry}>{c('Info').t`Retry now`}</Button>
                </div>
            );
        case TransferState.Progress:
            return (
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
            );
        default:
            return (
                <span>
                    {isDownloadAll
                        ? c('Info').t`Securely downloaded all encrypted files`
                        : c('Info').ngettext(
                              msgid`Securely downloaded ${nbFile} file`,
                              `Securely downloaded ${nbFile} files`,
                              nbFile
                          )}
                </span>
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

const SharedPageTransferManager = ({ rootItem }: Props) => {
    const [downloadedSize, setDownloadedSize] = useState<number>(0);
    const [totalSize, setTotalSize] = useState<number>(0);
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    const [nbFile, setNbFile] = useState<number>(0);

    const isProtonUser = !!getCookie(IS_PROTON_USER_COOKIE_NAME);
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

    if (!nbFile || !currentDownload) {
        return null;
    }

    return (
        <div
            className={clsx(
                'share-transfer-manager fixed bottom-0 right-0 border border-primary w-full md:min-w-custom max-w-custom m-0 md:mr-10 overflow-hidden',
                currentDownload.state === TransferState.Canceled && 'share-transfer-manager--canceled border-norm',
                (currentDownload.state === TransferState.Error ||
                    currentDownload.state === TransferState.NetworkError) &&
                    'share-transfer-manager--failed border-danger'
            )}
            style={{ '--min-w-custom': '27.5em', '--max-w-custom': '31.25em' }}
        >
            {currentDownload.state === TransferState.Progress ? (
                <button
                    className="share-transfer-manager-header w-full flex items-center justify-space-between"
                    onClick={() => setIsMinimized(!isMinimized)}
                >
                    <div className="flex items-center gap-2 pl-3">
                        {getHeaderText({
                            transferState: currentDownload.state,
                            percentageValue: getPercentageFormatter().format(percentageValue),
                        })}
                    </div>
                    <Tooltip title={isMinimized ? c('Action').t`Maximize` : c('Action').t`Minimize`}>
                        <ButtonLike
                            className="no-pointer-events"
                            as="span"
                            icon
                            shape="ghost"
                            data-testid="share-transfer-manager:minimize-maximize"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            <Icon
                                name={isMinimized ? 'chevron-up' : 'chevron-down'}
                                alt={isMinimized ? c('Action').t`Maximize` : c('Action').t`Minimize`}
                            />
                        </ButtonLike>
                    </Tooltip>
                </button>
            ) : (
                <div className="share-transfer-manager-header w-full flex items-center justify-space-between">
                    <div className="flex items-center gap-2 pl-3">
                        {getHeaderText({
                            transferState: currentDownload.state,
                            percentageValue: getPercentageFormatter().format(percentageValue),
                        })}
                    </div>
                    <Tooltip title={c('Action').t`Close`} onClick={() => clearDownloads()}>
                        <Button icon shape="ghost" data-testid="share-transfer-manager:close">
                            <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                        </Button>
                    </Tooltip>
                </div>
            )}
            <div
                className={clsx(
                    'share-transfer-manager-content',
                    isMinimized &&
                        currentDownload.state === TransferState.Progress &&
                        'share-transfer-manager-content--minimized'
                )}
            >
                {!isProtonUser &&
                (currentDownload.state === TransferState.Progress || currentDownload.state === TransferState.Done) ? (
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
                    <div className="px-4 py-5 flex items-center gap-2">
                        <FileIcon size={8} mimeType={currentDownload.meta.mimeType} />
                        {getContentText({
                            transferState: currentDownload.state,
                            onRetry: () => restartDownloads(currentDownload.id),
                            nbFile,
                            isDownloadAll,
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedPageTransferManager;

import { useEffect } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { NodeType } from '@proton/drive/index';
import { UploadStatus } from '@proton/drive/modules/upload';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import { IcCrossCircleFilled } from '@proton/icons/icons/IcCrossCircleFilled';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

import { useDownloadContainsDocumentsModal } from '../../../components/modals/DownloadContainsDocumentsModal';
import { DownloadManager } from '../../../managers/download/DownloadManager';
import { AbuseCategoryType, type AbuseReportPrefill } from '../../../modals/ReportAbuseModal';
import { useSignatureIssueModal } from '../../../modals/SignatureIssueModal';
import {
    BaseTransferStatus,
    IssueStatus,
    useDownloadManagerStore,
} from '../../../zustand/download/downloadManager.store';
import { useTransferManagerActions } from '../useTransferManagerActions';
import type { TransferManagerEntry } from '../useTransferManagerState';
import { isCancellable, isRetryable, isShareable } from '../utils/transferStatus';

type Props = {
    entry: TransferManagerEntry;
    onShare?: () => void;
    onReportAbuse?: (nodeUid: string, prefill?: AbuseReportPrefill) => void;
};

const getStatusLabel = (entry: TransferManagerEntry): string | undefined => {
    const labels: Record<string, string | undefined> = {
        [BaseTransferStatus.InProgress]: entry.type === 'download' ? c('Info').t`Downloading` : c('Info').t`Uploading`,
        [BaseTransferStatus.Pending]: c('Info').t`Waiting`,
        [BaseTransferStatus.Cancelled]: c('Info').t`Canceled`,
        [BaseTransferStatus.Failed]:
            entry.type === 'download' ? c('Info').t`Download Failed` : c('Info').t`Upload Failed`,
        [BaseTransferStatus.MalwareDetected]: c('Info').t`Malware detected`,
        [BaseTransferStatus.Finished]: entry.type === 'download' ? c('Info').t`Downloaded` : c('Info').t`Uploaded`,
        [BaseTransferStatus.Paused]: c('Info').t`Paused`,
        [BaseTransferStatus.PausedServer]: c('Info').t`Paused`,
        [UploadStatus.Preparing]: c('Info').t`Preparing`,
        [UploadStatus.ConflictFound]: c('Info').t`Waiting`,
        [UploadStatus.Waiting]: c('Info').t`Waiting`,
        [UploadStatus.ParentCancelled]: c('Info').t`Canceled`,
        // TODO: Probably we do not want skipped but cancelled of the item. Makes more sense but need update on uploadManager
        [UploadStatus.Skipped]: c('Info').t`Skipped`,
        [UploadStatus.PhotosDuplicate]: c('Info').t`Already in your library`,
    };
    return labels[entry.status];
};

const getItemIconByStatus = (entry: TransferManagerEntry) => {
    if (entry.status === BaseTransferStatus.Finished || entry.status === UploadStatus.PhotosDuplicate) {
        return <IcCheckmarkCircleFilled size={5} className="color-success" />;
    }
    if (entry.status === BaseTransferStatus.Pending || entry.status === UploadStatus.Waiting) {
        return <IcClock size={5} />;
    }
    if (entry.status === BaseTransferStatus.InProgress || entry.status === UploadStatus.Preparing) {
        return <CircleLoader size="small" className="color-signal-info" />;
    }
    if (entry.status === BaseTransferStatus.Cancelled) {
        return <IcCrossCircle size={5} className="color-weak" />;
    }
    if (entry.status === UploadStatus.Skipped) {
        return <IcCrossCircle size={5} className="color-weak" />;
    }
    if (entry.status === BaseTransferStatus.Failed) {
        return <IcCrossCircleFilled size={5} className="color-danger" />;
    }
    if (entry.status === BaseTransferStatus.MalwareDetected) {
        return <IcCrossCircleFilled size={5} className="color-danger" />;
    }
    if (entry.status === UploadStatus.ConflictFound) {
        return <IcClock size={5} className="color-weak" />;
    }
    return null;
};

export const TransferItem = ({ entry, onShare, onReportAbuse }: Props) => {
    // const showLocationText = c('Action').t`Show location`;
    const totalSize = entry.type === 'download' ? entry.storageSize : entry.clearTextSize;
    const { cancelTransfer, retryTransfer } = useTransferManagerActions();
    const [containsDocumentModal, showDocumentsModal] = useDownloadContainsDocumentsModal();
    const { signatureIssueModal, showSignatureIssueModal } = useSignatureIssueModal();
    const onlyShowTransferredBytes = !totalSize;
    // Encrypted size is larger from file clear text size, we prevent showing larger transferred size to the user during upload
    const transferredBytes = Math.min(totalSize, entry.transferredBytes);
    const transferredTotal = onlyShowTransferredBytes
        ? `${shortHumanSize(transferredBytes)}`
        : `${shortHumanSize(transferredBytes)} / ${shortHumanSize(totalSize)}`;

    const shouldHideSizeInfo = [
        BaseTransferStatus.Finished,
        BaseTransferStatus.Cancelled,
        BaseTransferStatus.Failed,
        BaseTransferStatus.MalwareDetected,
        UploadStatus.Skipped,
        UploadStatus.PhotosDuplicate,
    ].includes(entry.status as BaseTransferStatus);
    const dm = DownloadManager.getInstance();
    const { item } = useDownloadManagerStore(
        useShallow((state) => {
            return { item: state.getQueueItem(entry.id) };
        })
    );

    useEffect(() => {
        const { updateDownloadItem } = useDownloadManagerStore.getState();

        if (item?.unsupportedFileDetected === IssueStatus.Detected) {
            if (!item) {
                return;
            }
            showDocumentsModal({
                onSubmit: () => {
                    updateDownloadItem(item.downloadId, { unsupportedFileDetected: IssueStatus.Approved });
                },
                onCancel: () => {
                    cancelTransfer(entry);
                    updateDownloadItem(item.downloadId, { unsupportedFileDetected: IssueStatus.Rejected });
                },
            });
        }

        const issues = item?.signatureIssues ?? {};
        const unresolvedIssues = Object.values(issues).filter((issue) => issue.issueStatus === IssueStatus.Detected);
        const issue = unresolvedIssues[0];
        if (!item || !issue) {
            return;
        }
        if (item?.signatureIssueAllDecision) {
            // Case in which the user has selected an option with applyAll already
            dm.resolveSignatureIssue(item, issue.name, item?.signatureIssueAllDecision);
        } else {
            showSignatureIssueModal({
                isFile: issue.nodeType === NodeType.File || issue.nodeType === NodeType.Photo,
                downloadName: item.name,
                message: issue.message,
                apply: (decision: IssueStatus, applyAll: boolean) => {
                    applyAll = decision === IssueStatus.Rejected ? true : applyAll;
                    dm.resolveSignatureIssue(item, issue.name, decision, applyAll);
                },
                cancelAll: () => {
                    dm.resolveSignatureIssue(item, issue.name, IssueStatus.Rejected, true);
                    cancelTransfer(entry);
                },
            });
        }
        // showModal not in deps because is not stable
    }, [item, entry.id, cancelTransfer]);

    const downloadAnyway = () => {
        dm.setMalawareDecision(entry.id, IssueStatus.Approved);
    };

    const reportMalware = async () => {
        if (!item?.malwareInfo || !onReportAbuse) {
            return;
        }
        onReportAbuse(item.malwareInfo.uid, {
            category: AbuseCategoryType.Malware,
            comment: item.malwareInfo.message,
        });
    };

    const shouldShowFailedMessage = entry.status === BaseTransferStatus.Failed && entry.error;
    const shouldShowInfo = shouldShowFailedMessage || !shouldHideSizeInfo;

    return (
        <div
            className="bg-norm flex w-full gap-1 items-center py-2 pl-3 pr-4 h-full min-h-custom group-hover-opacity-container"
            style={{ '--min-h-custom': '3.3rem' }}
            data-testid="transfer-item-row"
        >
            <div className="mr-1 w-custom flex justify-center" style={{ '--w-custom': '1.5rem' }}>
                {getItemIconByStatus(entry)}
            </div>
            <div className="flex-1 max-w-full text-ellipsis ">
                <span className="text-nowrap text-rg" data-testid="transfer-row:name">
                    {entry.name}
                </span>
                <div className="gap-1 flex items-center">
                    <span className="text-sm color-weak" data-testid="transfer-row:status">
                        {getStatusLabel(entry)}
                    </span>
                    {/* TODO: Uncomment once Show location is able to highlight and scroll to the item */}
                    {/*{entry.type === 'upload' && entry.status === BaseTransferStatus.Finished && (
                        <>
                            <span aria-hidden="true" className="text-sm text-weak">
                                &middot;
                            </span>
                            <Button
                                color="weak"
                                shape="underline"
                                size="small"
                                className="text-sm text-weak"
                                onClick={() => goToLocation(entry)}
                            >
                                {showLocationText}
                            </Button>
                        </>
                    )}*/}
                    {shouldShowInfo && (
                        <>
                            <span aria-hidden="true" className="text-sm text-weak">
                                &middot;
                            </span>
                            <span
                                className="text-ellipsis text-nowrap text-sm color-weak text-tabular-nums"
                                data-testid="transfer-row:transferred-data"
                            >
                                {shouldShowFailedMessage ? entry.error?.message : ''}
                                {!shouldHideSizeInfo ? transferredTotal : ''}
                            </span>
                        </>
                    )}
                </div>
            </div>
            <div className="shrink-0 flex justify-end">
                {isShareable(entry) && entry.type === 'upload' && onShare && (
                    <Button color="weak" shape="solid" onClick={onShare}>
                        {c('Action').t`Share`}
                    </Button>
                )}
                {isCancellable(entry) && (
                    <Tooltip title={c('Action').t`Cancel`}>
                        <Button
                            icon
                            className="group-hover:opacity-100"
                            color="weak"
                            shape="outline"
                            onClick={() => cancelTransfer(entry)}
                            data-testid="drive-transfers-manager:item-controls-cancel"
                        >
                            <IcCrossBig size={4} />
                        </Button>
                    </Tooltip>
                )}
                {entry.status === BaseTransferStatus.MalwareDetected && (
                    <div className="flex gap-1">
                        {onReportAbuse && (
                            <Tooltip title={c('Action').t`Report`}>
                                <Button
                                    icon
                                    className="group-hover:opacity-100"
                                    color="weak"
                                    shape="outline"
                                    onClick={() => reportMalware()}
                                    data-testid="drive-transfers-manager:item-controls-report"
                                >
                                    <IcExclamationCircle size={4} />
                                </Button>
                            </Tooltip>
                        )}

                        <Tooltip title={c('Action').t`Download anyway`}>
                            <Button
                                icon
                                className="group-hover:opacity-100"
                                color="weak"
                                shape="outline"
                                onClick={() => downloadAnyway()}
                                data-testid="drive-transfers-manager:item-controls-download-anyway"
                            >
                                {c('Action').t`Download anyway`}
                            </Button>
                        </Tooltip>
                    </div>
                )}
                {isRetryable(entry) && (
                    <Button
                        color="weak"
                        shape="outline"
                        onClick={() => retryTransfer(entry)}
                        data-testid="drive-transfers-manager:item-controls-restart"
                    >
                        {c('Action').t`Retry`}
                    </Button>
                )}
            </div>
            {containsDocumentModal}
            {signatureIssueModal}
        </div>
    );
};

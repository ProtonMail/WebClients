import { useEffect } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components/index';
import { NodeType, splitNodeUid } from '@proton/drive/index';
import { UploadStatus } from '@proton/drive/modules/upload';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

import { useDownloadContainsDocumentsModal } from '../../../components/modals/DownloadContainsDocumentsModal';
import { useReportAbuseModal } from '../../../components/modals/ReportAbuseModal/ReportAbuseModal';
import { DownloadManager } from '../../../managers/download/DownloadManager';
import { useSignatureIssueModal } from '../../../modals/SignatureIssueModal/SignatureIssueModal';
import {
    BaseTransferStatus,
    IssueStatus,
    useDownloadManagerStore,
} from '../../../zustand/download/downloadManager.store';
import { getMalwareReportComment, useMalwareReport } from '../useMalwareReport/useMalwareReport';
import { useTransferManagerActions } from '../useTransferManagerActions';
import type { TransferManagerEntry } from '../useTransferManagerState';

type Props = {
    entry: TransferManagerEntry;
    onShare?: () => void;
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
        [UploadStatus.ConflictFound]: c('Info').t`Waiting`,
        [UploadStatus.ParentCancelled]: c('Info').t`Canceled`,
        // TODO: Probably we do not want skipped but cancelled of the item. Makes more sense but need update on uploadManager
        [UploadStatus.Skipped]: c('Info').t`Skipped`,
        [UploadStatus.PhotosDuplicate]: c('Info').t`Already in your library`,
    };
    return labels[entry.status];
};

const getItemIconByStatus = (entry: TransferManagerEntry) => {
    if (entry.status === BaseTransferStatus.Finished || entry.status === UploadStatus.PhotosDuplicate) {
        return <Icon size={5} className="color-success" name="checkmark-circle-filled" />;
    }
    if (entry.status === BaseTransferStatus.Pending) {
        return <Icon size={5} name="clock" />;
    }
    if (entry.status === BaseTransferStatus.InProgress) {
        return <CircleLoader size="small" className="color-signal-info" />;
    }
    if (entry.status === BaseTransferStatus.Cancelled) {
        return <Icon size={5} className="color-weak" name="cross-circle" />;
    }
    if (entry.status === UploadStatus.Skipped) {
        return <Icon size={5} className="color-weak" name="cross-circle" />;
    }
    if (entry.status === BaseTransferStatus.Failed) {
        return <Icon size={5} className="color-danger" name="cross-circle-filled" />;
    }
    if (entry.status === BaseTransferStatus.MalwareDetected) {
        return <Icon size={5} className="color-danger" name="cross-circle-filled" />;
    }
    if (entry.status === UploadStatus.ConflictFound) {
        return <Icon size={5} className="color-weak" name="clock" />;
    }
    return null;
};

export const TransferItem = ({ entry, onShare }: Props) => {
    // const showLocationText = c('Action').t`Show location`;
    const totalSize = entry.type === 'download' ? entry.storageSize : entry.clearTextSize;
    const { cancelTransfer, retryTransfer } = useTransferManagerActions();
    const [containsDocumentModal, showDocumentsModal] = useDownloadContainsDocumentsModal();
    const [signatureIssueModal, showSignatureIssueModal] = useSignatureIssueModal();
    const [reportAbuseModal, showReportAbuseModal] = useReportAbuseModal();
    const { submitMalwareReport } = useMalwareReport();
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
        if (!item?.malwareInfo) {
            return;
        }
        return showReportAbuseModal({
            linkInfo: {
                name: item.malwareInfo.name,
                mimeType: item.malwareInfo.mediaType,
                size: item.malwareInfo.size,
                linkId: splitNodeUid(item.malwareInfo.uid).nodeId,
            },
            onSubmit: (params) => {
                alert('Feature not yet implemented');
                return submitMalwareReport(params);
            },
            prefilled: {
                Category: 'malware',
                Comment: getMalwareReportComment(item.name, item.malwareInfo.message),
            },
        });
    };

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
                    {!shouldHideSizeInfo && (
                        <>
                            <span aria-hidden="true" className="text-sm text-weak">
                                &middot;
                            </span>
                            <span
                                className="text-ellipsis text-nowrap text-sm color-weak text-tabular-nums"
                                data-testid="transfer-row:transferred-data"
                            >
                                {transferredTotal}
                            </span>
                        </>
                    )}
                </div>
            </div>
            <div className="shrink-0 flex justify-end">
                {(entry.status === BaseTransferStatus.Finished || entry.status === UploadStatus.PhotosDuplicate) &&
                    entry.type === 'upload' &&
                    onShare && (
                        <Button color="weak" shape="solid" onClick={onShare}>
                            {c('Action').t`Share`}
                        </Button>
                    )}
                {(entry.status === BaseTransferStatus.InProgress || entry.status === BaseTransferStatus.Pending) && (
                    <Tooltip title={c('Action').t`Cancel`}>
                        <Button
                            icon
                            className="group-hover:opacity-100"
                            color="weak"
                            shape="outline"
                            onClick={() => cancelTransfer(entry)}
                            data-testid="drive-transfers-manager:item-controls-cancel"
                        >
                            <Icon name="cross-big" size={4} />
                        </Button>
                    </Tooltip>
                )}
                {entry.status === BaseTransferStatus.MalwareDetected && (
                    <div className="flex gap-1">
                        <Tooltip title={c('Action').t`Report`}>
                            <Button
                                icon
                                className="group-hover:opacity-100"
                                color="weak"
                                shape="outline"
                                onClick={() => reportMalware()}
                                data-testid="drive-transfers-manager:item-controls-cancel"
                            >
                                <Icon name="exclamation-circle" size={4} />
                            </Button>
                        </Tooltip>

                        <Tooltip title={c('Action').t`Download anyway`}>
                            <Button
                                icon
                                className="group-hover:opacity-100"
                                color="weak"
                                shape="outline"
                                onClick={() => downloadAnyway()}
                                data-testid="drive-transfers-manager:item-controls-cancel"
                            >
                                {c('Action').t`Download anyway`}
                            </Button>
                        </Tooltip>
                    </div>
                )}
                {(entry.status === BaseTransferStatus.Failed || entry.status === BaseTransferStatus.Cancelled) && (
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
            {reportAbuseModal}
        </div>
    );
};

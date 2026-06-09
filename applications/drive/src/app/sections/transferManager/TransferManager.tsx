import { useEffect, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useBeforeUnload, useConfirmActionModal } from '@proton/components';
import { uploadManager } from '@proton/drive/modules/upload';
import type { FreeSubscription, Subscription } from '@proton/payments';
import clsx from '@proton/utils/clsx';

import type { AbuseReportPrefill } from '../../modals/ReportAbuseModal';
import { useUploadConflictModal } from '../../modals/UploadConflictModal';
import { DownloadIssueWatcher } from './connectedComponents/DownloadIssueWatcher';
import { TransferManagerBanner } from './connectedComponents/TransferManagerBanner';
import { TransferManagerHeader } from './connectedComponents/TransferManagerHeader';
import { TransferManagerList } from './connectedComponents/TransferManagerList';
import { subscribeToUploadEvents } from './subscribeToUploadEvents';
import { useTransferManagerStore } from './transferManager.store';
import { useTransferManagerActions } from './useTransferManagerActions';
import { TransferManagerStatus, useTransferManagerState } from './useTransferManagerState';

import './TransferManager.scss';

interface TransferManagerProps {
    drawerWidth?: number;
    deprecatedRootShareId: string | undefined;
    className?: string;
    onReportAbuse?: (nodeUid: string, prefill?: AbuseReportPrefill) => void;
    subscription?: Subscription | FreeSubscription;
}

export const TransferManager = ({
    drawerWidth = 0,
    deprecatedRootShareId,
    className,
    onReportAbuse,
    subscription,
}: TransferManagerProps) => {
    const { items, status, isVisible } = useTransferManagerState();
    const {
        clearQueue,
        cancelAll,
        cancelTransfer,
        retryTransfer,
        retryFailedTransfers,
        share,
        confirmModal: actionsConfirmModal,
        sharingModal,
        containsDocumentModal,
        showDocumentsModal,
        signatureIssueModal,
        showSignatureIssueModal,
    } = useTransferManagerActions();
    const [isMinimized, setMinimized] = useState(false);
    const [leaveMessage, setLeaveMessage] = useState('');
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    useBeforeUnload(leaveMessage);

    const { bannerType } = useTransferManagerStore(
        useShallow((state) => ({
            bannerType: state.bannerType,
        }))
    );
    const [uploadConflictModal, showUploadConflictModal] = useUploadConflictModal();

    useEffect(() => {
        if (status === TransferManagerStatus.InProgress || status === TransferManagerStatus.Failed) {
            const message = c('Unload warning').t`Changes you made may not be saved.`;
            setLeaveMessage(message);
        } else {
            setLeaveMessage('');
        }
    }, [status]);

    useEffect(() => {
        uploadManager.setConflictResolver(async (name, nodeType, conflictType) => {
            return new Promise<{ strategy: any; applyToAll: boolean }>((resolve) => {
                showUploadConflictModal({
                    name,
                    nodeType,
                    conflictType,
                    onResolve: (strategy, applyToAll) => {
                        resolve({ strategy, applyToAll });
                    },
                });
            });
        });

        const unsubscribe = subscribeToUploadEvents();

        return () => {
            unsubscribe();
            uploadManager.removeConflictResolver();
        };
    }, [showUploadConflictModal]);

    const toggleMinimize = () => {
        setMinimized((value) => !value);
    };

    const onClose = async () => {
        if (status === TransferManagerStatus.InProgress || status === TransferManagerStatus.Failed) {
            void showConfirmModal({
                title: c('Title').t`Stop transfers?`,
                cancelText: c('Action').t`Continue transfers`,
                submitText: c('Action').t`Stop transfers`,
                message: c('Info')
                    .t`There are files that still need to be transferred. Closing the transfer manager will end all operations.`,
                onSubmit: async () => clearQueue(),
                canUndo: true,
            });
        } else {
            await clearQueue();
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            id="transfer-manager"
            className={clsx('transfer-manager-fixed-position right-custom border border-weak', className)}
            style={{
                '--right-custom': `${(drawerWidth + 32) / 16}rem`, // 32 == 2rem
            }}
        >
            <section aria-label={c('Label').t`File transfer overview`}>
                <TransferManagerHeader
                    toggleMinimize={toggleMinimize}
                    isMinimized={isMinimized}
                    onClose={onClose}
                    cancelAll={cancelAll}
                    retryFailedTransfers={retryFailedTransfers}
                />

                {items
                    .filter((entry) => entry.type === 'download')
                    .map((entry) => (
                        <DownloadIssueWatcher
                            key={entry.id}
                            entry={entry}
                            cancelTransfer={cancelTransfer}
                            showDocumentsModal={showDocumentsModal}
                            showSignatureIssueModal={showSignatureIssueModal}
                        />
                    ))}
                {!isMinimized && (
                    <div className="mt-3 pb-4" data-testid="drive-transfers-manager:list">
                        <TransferManagerList
                            items={items}
                            deprecatedRootShareId={deprecatedRootShareId}
                            share={share}
                            cancelTransfer={cancelTransfer}
                            retryTransfer={retryTransfer}
                            onReportAbuse={onReportAbuse}
                        />
                        {bannerType ? (
                            <TransferManagerBanner
                                className="mx-3 mt-3"
                                type={bannerType}
                                subscription={subscription}
                                onAction={() => useTransferManagerStore.getState().setBannerType(undefined)}
                            />
                        ) : null}
                    </div>
                )}

                {uploadConflictModal}
                {confirmModal}
                {actionsConfirmModal}
                {sharingModal}
                {containsDocumentModal}
                {signatureIssueModal}
            </section>
        </div>
    );
};

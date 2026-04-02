import { useEffect, useState } from 'react';

import { Vr } from '@proton/atoms/Vr/Vr';
import { ContextSeparator } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';
import { MemberRole, getDrivePerNodeType, splitNodeUid } from '@proton/drive';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { downloadManager } from '../../../managers/download/DownloadManager';
import type { useDetailsModal } from '../../../modals/DetailsModal';
import type { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import type { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import type { useDrivePreviewModal } from '../../../modals/preview';
import { useOpenInDocs } from '../../../store/_documents';
import { downloadDocument, openDocsOrSheetsDocument } from '../../../utils/docs/openInDocs';
import { isPreviewOrFallbackAvailable } from '../../../utils/isPreviewOrFallbackAvailable';
import { getNodeEffectiveRole } from '../../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { DetailsButton } from '../../commonButtons/DetailsButton';
import { DownloadButton } from '../../commonButtons/DownloadButton';
import { OpenInDocsOrSheetsButton } from '../../commonButtons/OpenInDocsOrSheetsButton';
import { PreviewButton } from '../../commonButtons/PreviewButton';
import { ShareButton } from '../../commonButtons/ShareButton';
import { CopyButton } from '../../folders/buttons/CopyButton';
import { RemoveMeButton } from '../buttons/RemoveMeButton';
import type { DirectShareItem } from '../useSharedWithMe.store';
import { createItemChecker } from './actionsItemsChecker';

interface BaseDirectShareActionsProps {
    selectedItems: DirectShareItem[];
    showPreviewModal: ReturnType<typeof useDrivePreviewModal>['showPreviewModal'];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    showDetailsModal: ReturnType<typeof useDetailsModal>['showDetailsModal'];
    showFilesDetailsModal: ReturnType<typeof useFilesDetailsModal>['showFilesDetailsModal'];
    showCopyModal: (items: DirectShareItem[]) => void;
    showSharingModal: ReturnType<typeof useSharingModal>['showSharingModal'];
}

interface ContextMenuDirectShareActionsProps extends BaseDirectShareActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarDirectShareActionsProps extends BaseDirectShareActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type DirectShareActionsProps = ContextMenuDirectShareActionsProps | ToolbarDirectShareActionsProps;

export const DirectShareActions = ({
    selectedItems,
    showPreviewModal,
    showConfirmModal,
    showDetailsModal,
    showFilesDetailsModal,
    showCopyModal,
    showSharingModal,
    close,
    buttonType,
}: DirectShareActionsProps) => {
    const itemChecker = createItemChecker(selectedItems);
    const singleItem = selectedItems.at(0);

    const copyAction = () => showCopyModal(selectedItems);

    const downloadItems = () => {
        if (itemChecker.isOnlyOneFile && singleItem?.mediaType) {
            const item = selectedItems[0];
            if (isProtonDocsDocument(singleItem.mediaType)) {
                void downloadDocument({
                    type: 'doc',
                    openBehavior: 'redirect',
                    uid: item.nodeUid,
                });
                return;
            } else if (isProtonDocsSpreadsheet(singleItem.mediaType)) {
                void downloadDocument({
                    type: 'doc',
                    openBehavior: 'redirect',
                    uid: item.nodeUid,
                });
                return;
            }
        }

        void downloadManager.download(selectedItems.map((item) => item.nodeUid));
    };

    const openInDocs = useOpenInDocs(
        singleItem
            ? {
                  linkId: splitNodeUid(singleItem.nodeUid).nodeId,
                  mimeType: singleItem.mediaType || '',
                  parentLinkId: '', // No parentLinkId on shared with me item
                  rootShareId: singleItem.shareId ?? '',
              }
            : undefined
    );

    // Items in "shared with me" section can only be re-shared if the user has admin rights
    const [hasAdminRole, setHasAdminRole] = useState(false);
    useEffect(() => {
        if (selectedItems.length !== 1) {
            return;
        }

        async function isCurrentUserAdmin() {
            if (!singleItem) {
                return;
            }

            const drive = getDrivePerNodeType(singleItem.type);
            const { node } = await drive.getNode(singleItem.nodeUid).then(getNodeEntity);
            const role = await getNodeEffectiveRole(node, drive);
            setHasAdminRole(role === MemberRole.Admin);
        }
        void isCurrentUserAdmin();
    }, [selectedItems, singleItem]);

    if (!singleItem) {
        return null;
    }

    const hasPreviewAvailable = itemChecker.hasPreviewAvailable(isPreviewAvailable);

    return (
        <>
            {hasPreviewAvailable && (
                <PreviewButton
                    onClick={() => {
                        showPreviewModal({
                            nodeUid: singleItem.nodeUid,
                            deprecatedContextShareId: '',
                            previewableNodeUids: selectedItems
                                .filter(
                                    (item) => item.mediaType && isPreviewOrFallbackAvailable(item.mediaType, item.size)
                                )
                                .map((item) => item.nodeUid),
                        });
                    }}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
            {itemChecker.isOnlyOneFile && openInDocs.canOpen && (
                <OpenInDocsOrSheetsButton
                    isNative={openInDocs.isNative}
                    type={openInDocs.type}
                    onClick={() =>
                        openDocsOrSheetsDocument({
                            uid: singleItem.nodeUid,
                            isNative: openInDocs.isNative,
                            type: openInDocs.type,
                            openBehavior: 'tab',
                        })
                    }
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
            {itemChecker.canDownload && (
                <DownloadButton
                    onClick={downloadItems}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
            {/*// TODO: Migrate this to buttonType*/}
            {itemChecker.canCopy && (
                <CopyButton
                    onClick={copyAction}
                    {...(buttonType === 'contextMenu' ? { close, type: 'context' } : { type: 'toolbar' })}
                />
            )}

            {selectedItems.length >= 1 ? (
                <DetailsButton
                    onClick={() => {
                        if (selectedItems.length === 1) {
                            void showDetailsModal({
                                nodeUid: singleItem.nodeUid,
                            });
                        } else if (selectedItems.length > 1) {
                            void showFilesDetailsModal({
                                nodeUids: selectedItems.map((item) => item.nodeUid),
                            });
                        }
                    }}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            ) : null}
            {itemChecker.isOnlyOneItem && hasAdminRole && (
                <ShareButton
                    onClick={() => showSharingModal({ nodeUid: singleItem.nodeUid })}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
            {itemChecker.isOnlyOneItem && (
                <>
                    {buttonType === 'contextMenu' ? <ContextSeparator /> : <Vr />}
                    <RemoveMeButton
                        nodeUid={singleItem.nodeUid}
                        type={singleItem.type}
                        showConfirmModal={showConfirmModal}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                </>
            )}
        </>
    );
};

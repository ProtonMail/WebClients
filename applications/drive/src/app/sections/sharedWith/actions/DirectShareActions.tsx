import { useEffect, useState } from 'react';

import { Vr } from '@proton/atoms/Vr/Vr';
import { ContextSeparator } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';
import { MemberRole, getDrivePerNodeType, splitNodeUid } from '@proton/drive';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import {
    DetailsButton as ContextDetailsButton,
    DownloadButton as ContextDownloadButton,
    OpenInDocsButton as ContextOpenInDocsButton,
    PreviewButton as ContextPreviewButton,
} from '../../../components/sections/ContextMenu/buttons';
import {
    DetailsButton as ToolbarDetailsButton,
    DownloadButton as ToolbarDownloadButton,
    OpenInDocsButton as ToolbarOpenInDocsButton,
    PreviewButton as ToolbarPreviewButton,
} from '../../../components/sections/ToolbarButtons';
import type { useDetailsModal } from '../../../modals/DetailsModal';
import type { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import type { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import type { useDrivePreviewModal } from '../../../modals/preview';
import { useOpenInDocs } from '../../../store/_documents';
import { getNodeEffectiveRole } from '../../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { CopyButton } from '../../folders/buttons/CopyButton';
import { ShareLinkButton } from '../../folders/buttons/ShareLinkButton';
import { RemoveMeButton } from '../buttons/RemoveMeButton';
import type { DirectShareItem } from '../useSharedWithMe.store';
import { createItemChecker, mapToLegacyFormat } from './actionsItemsChecker';

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

    const legacyItems = mapToLegacyFormat(selectedItems);
    const hasPreviewAvailable = itemChecker.hasPreviewAvailable(isPreviewAvailable);

    if (buttonType === 'toolbar') {
        return (
            <>
                <ToolbarPreviewButton selectedBrowserItems={legacyItems} />
                <ToolbarOpenInDocsButton selectedBrowserItems={legacyItems} />
                {itemChecker.canDownload && <ToolbarDownloadButton selectedBrowserItems={legacyItems} />}
                {itemChecker.canCopy && <CopyButton type="toolbar" close={close} onClick={copyAction} />}
                {itemChecker.isOnlyOneItem && hasAdminRole && (
                    <ShareLinkButton
                        type="toolbar"
                        onClick={() => showSharingModal({ nodeUid: singleItem.nodeUid })}
                        close={close}
                    />
                )}
                <ToolbarDetailsButton selectedBrowserItems={legacyItems} />
                {itemChecker.isOnlyOneItem && hasAdminRole && (
                    <>
                        <Vr />
                        <RemoveMeButton
                            nodeUid={singleItem.nodeUid}
                            type={singleItem.type}
                            showConfirmModal={showConfirmModal}
                            buttonType="toolbar"
                        />
                    </>
                )}
            </>
        );
    }

    return (
        <>
            {hasPreviewAvailable && (
                <ContextPreviewButton
                    shareId={singleItem.shareId ?? ''}
                    linkId={splitNodeUid(singleItem.nodeUid).nodeId}
                    nodeUid={singleItem.nodeUid}
                    showPreviewModal={showPreviewModal}
                    close={close}
                />
            )}

            {itemChecker.isOnlyOneFile && openInDocs.canOpen && (
                <ContextOpenInDocsButton {...openInDocs} close={close} />
            )}

            {itemChecker.canDownload && <ContextDownloadButton selectedBrowserItems={legacyItems} close={close} />}

            {itemChecker.canCopy && <CopyButton type="context" close={close} onClick={copyAction} />}

            <ContextDetailsButton
                selectedBrowserItems={legacyItems}
                showDetailsModal={showDetailsModal}
                showFilesDetailsModal={showFilesDetailsModal}
                close={close}
            />

            {itemChecker.isOnlyOneItem && hasAdminRole && (
                <ShareLinkButton
                    type="context"
                    onClick={() => showSharingModal({ nodeUid: singleItem.nodeUid })}
                    close={close}
                />
            )}

            {itemChecker.isOnlyOneItem && (
                <>
                    <ContextSeparator />
                    <RemoveMeButton
                        nodeUid={singleItem.nodeUid}
                        type={singleItem.type}
                        showConfirmModal={showConfirmModal}
                        close={close}
                        buttonType="contextMenu"
                    />
                </>
            )}
        </>
    );
};

import { Vr } from '@proton/atoms';
import { ContextSeparator } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';
import { NodeType, splitNodeUid } from '@proton/drive';
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
import { useOpenInDocs } from '../../../store/_documents';
import type { DirectShareItem } from '../../../zustand/sections/sharedWithMeListing.store';
import { RemoveMeButton } from '../buttons/RemoveMeButton';
import { createItemChecker, mapToLegacyFormat } from './actionsItemsChecker';

interface BaseDirectShareActionsProps {
    selectedItems: DirectShareItem[];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    showDetailsModal: (props: { shareId: string; linkId: string; volumeId: string }) => void;
    showFilesDetailsModal: (props: { selectedItems: { rootShareId: string; linkId: string }[] }) => void;
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
    showConfirmModal,
    showDetailsModal,
    showFilesDetailsModal,
    close,
    buttonType,
}: DirectShareActionsProps) => {
    const itemChecker = createItemChecker(selectedItems);
    const singleItem = selectedItems.at(0);

    const openInDocs = useOpenInDocs(
        singleItem
            ? {
                  linkId: splitNodeUid(singleItem.nodeUid).nodeId,
                  mimeType: singleItem.mediaType || '',
                  parentLinkId: '', // No parentLinkId on shared with me item
                  rootShareId: singleItem.shareId,
              }
            : undefined
    );

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
                <ToolbarDetailsButton selectedBrowserItems={legacyItems} />
                {itemChecker.isOnlyOneItem && (
                    <>
                        <Vr />
                        <RemoveMeButton
                            nodeUid={singleItem.nodeUid}
                            shareId={singleItem.shareId}
                            isAlbum={singleItem.type === NodeType.Album}
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
                    shareId={singleItem.shareId}
                    linkId={splitNodeUid(singleItem.nodeUid).nodeId}
                    close={close}
                />
            )}

            {itemChecker.isOnlyOneFile && openInDocs.canOpen && (
                <ContextOpenInDocsButton {...openInDocs} close={close} />
            )}

            {itemChecker.canDownload && <ContextDownloadButton selectedBrowserItems={legacyItems} close={close} />}

            <ContextDetailsButton
                selectedBrowserItems={legacyItems}
                showDetailsModal={showDetailsModal}
                showFilesDetailsModal={showFilesDetailsModal}
                close={close}
            />

            {itemChecker.isOnlyOneItem && (
                <>
                    <ContextSeparator />
                    <RemoveMeButton
                        nodeUid={singleItem.nodeUid}
                        shareId={singleItem.shareId}
                        isAlbum={singleItem.type === NodeType.Album}
                        showConfirmModal={showConfirmModal}
                        close={close}
                        buttonType="contextMenu"
                    />
                </>
            )}
        </>
    );
};

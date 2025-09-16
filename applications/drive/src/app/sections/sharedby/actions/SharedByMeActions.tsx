import { Vr } from '@proton/atoms';
import { ContextSeparator, type useConfirmActionModal } from '@proton/components';
import { NodeType, splitNodeUid } from '@proton/drive/index';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { useRenameModal } from '../../../components/modals/RenameModal';
import type { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import {
    DetailsButton as ContextDetailsButton,
    DownloadButton as ContextDownloadButton,
    OpenInDocsButton as ContextOpenInDocsButton,
    PreviewButton as ContextPreviewButton,
    RenameButton as ContextRenameButton,
    ShareLinkButton as ContextShareLinkButton,
} from '../../../components/sections/ContextMenu/buttons';
import {
    DetailsButton as ToolbarDetailsButton,
    DownloadButton as ToolbarDownloadButton,
    OpenInDocsButton as ToolbarOpenInDocsButton,
    PreviewButton as ToolbarPreviewButton,
    RenameButton as ToolbarRenameButton,
    ShareLinkButton as ToolbarShareLinkButton,
} from '../../../components/sections/ToolbarButtons';
import { useOpenInDocs } from '../../../hooks/docs/useOpenInDocs';
import { useActions } from '../../../store';
import { StopSharingButton } from '../buttons/StopSharingButton';
import type { SharedByMeItem } from '../useSharedByMe.store';
import { createItemChecker, mapToLegacyFormat } from './actionsItemsChecker';

interface BaseSharedByMeActionsProps {
    selectedItems: SharedByMeItem[];
    showDetailsModal: (props: { shareId: string; linkId: string; volumeId: string }) => void;
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    showRenameModal: ReturnType<typeof useRenameModal>[1];
    showFilesDetailsModal: (props: { selectedItems: { rootShareId: string; linkId: string }[] }) => void;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ContextMenuSharedByMeActionsProps extends BaseSharedByMeActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarSharedByMeActionsProps extends BaseSharedByMeActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type SharedByMeActionsProps = ContextMenuSharedByMeActionsProps | ToolbarSharedByMeActionsProps;

export const SharedByMeActions = ({
    selectedItems,
    close,
    buttonType,
    showDetailsModal,
    showRenameModal,
    showFilesDetailsModal,
    showLinkSharingModal,
    showConfirmModal,
}: SharedByMeActionsProps) => {
    const itemChecker = createItemChecker(selectedItems);
    const singleItem = selectedItems.at(0);

    const { renameLink } = useActions();

    const openInDocs = useOpenInDocs(
        singleItem
            ? {
                  uid: singleItem.nodeUid,
                  mediaType: singleItem.mediaType,
                  parentUid: singleItem.parentUid,
              }
            : undefined
    );
    const hasPreviewAvailable = itemChecker.hasPreviewAvailable(isPreviewAvailable);
    const legacyItems = mapToLegacyFormat(selectedItems);

    const splitedSingleItemUid = singleItem ? splitNodeUid(singleItem?.nodeUid) : undefined;
    if (selectedItems.length === 0) {
        return null;
    }

    if (buttonType === 'toolbar') {
        return (
            <>
                <ToolbarPreviewButton selectedBrowserItems={legacyItems} />
                <ToolbarOpenInDocsButton selectedBrowserItems={legacyItems} />
                {itemChecker.canDownload && <ToolbarDownloadButton selectedBrowserItems={legacyItems} />}
                {itemChecker.canRename && <ToolbarRenameButton selectedLinks={legacyItems} renameLink={renameLink} />}
                <ToolbarDetailsButton selectedBrowserItems={legacyItems} />
                {itemChecker.canShare && splitedSingleItemUid && singleItem && (
                    <>
                        <Vr />
                        <ToolbarShareLinkButton
                            volumeId={splitedSingleItemUid.volumeId}
                            shareId={singleItem.rootShareId}
                            linkId={splitedSingleItemUid.nodeId}
                        />
                    </>
                )}
                {itemChecker.canStopSharing && singleItem && (
                    <StopSharingButton
                        showConfirmModal={showConfirmModal}
                        uid={singleItem.nodeUid}
                        parentUid={singleItem.parentUid}
                        buttonType="toolbar"
                    />
                )}
            </>
        );
    }

    return (
        <>
            {hasPreviewAvailable && splitedSingleItemUid && singleItem && (
                <ContextPreviewButton
                    shareId={singleItem.rootShareId}
                    linkId={splitedSingleItemUid.nodeId}
                    close={close}
                />
            )}
            {itemChecker.isOnlyOneFile && openInDocs.canOpen && (
                <ContextOpenInDocsButton {...openInDocs} close={close} />
            )}
            {itemChecker.canDownload && <ContextDownloadButton selectedBrowserItems={legacyItems} close={close} />}
            {itemChecker.canRename && splitedSingleItemUid && singleItem && (
                <ContextRenameButton
                    link={{
                        name: singleItem.name,
                        linkId: splitedSingleItemUid.nodeId,
                        volumeId: splitedSingleItemUid.volumeId,
                        mimeType: singleItem.mediaType || '',
                        isFile: singleItem.type === NodeType.File,
                        rootShareId: singleItem.rootShareId,
                    }}
                    showRenameModal={showRenameModal}
                    close={close}
                />
            )}
            <ContextDetailsButton
                selectedBrowserItems={legacyItems}
                showDetailsModal={showDetailsModal}
                showFilesDetailsModal={showFilesDetailsModal}
                close={close}
            />
            {itemChecker.canShare && splitedSingleItemUid && singleItem && (
                <ContextShareLinkButton
                    volumeId={splitedSingleItemUid.volumeId}
                    shareId={singleItem.rootShareId}
                    linkId={splitedSingleItemUid.nodeId}
                    showLinkSharingModal={showLinkSharingModal}
                    close={close}
                />
            )}
            {itemChecker.canStopSharing && singleItem && (
                <>
                    <ContextSeparator />
                    <StopSharingButton
                        showConfirmModal={showConfirmModal}
                        uid={singleItem.nodeUid}
                        parentUid={singleItem.parentUid}
                        buttonType="contextMenu"
                        close={close}
                    />
                </>
            )}
        </>
    );
};

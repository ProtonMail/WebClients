import { Vr } from '@proton/atoms/Vr/Vr';
import { ContextSeparator, type useConfirmActionModal } from '@proton/components';
import { NodeType, splitNodeUid } from '@proton/drive';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import {
    DetailsButton as ContextDetailsButton,
    DownloadButton as ContextDownloadButton,
    PreviewButton as ContextPreviewButton,
    ShareLinkButton as ContextShareLinkButton,
} from '../../../components/sections/ContextMenu/buttons';
import {
    DetailsButton as ToolbarDetailsButton,
    DownloadButton as ToolbarDownloadButton,
    PreviewButton as ToolbarPreviewButton,
    RenameButton as ToolbarRenameButton,
    ShareLinkButton as ToolbarShareLinkButton,
} from '../../../components/sections/ToolbarButtons';
import type { useDetailsModal } from '../../../modals/DetailsModal';
import type { useRenameModal } from '../../../modals/RenameModal';
import type { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import type { usePreviewModal } from '../../../modals/preview';
import { useActions } from '../../../store';
import { openDocsOrSheetsDocument } from '../../../utils/docs/openInDocs';
import { RenameActionButton } from '../../buttons/RenameActionButton';
import { OpenInDocsOrSheetsButton } from '../../commonButtons/OpenInDocsOrSheetsButton';
import { StopSharingButton } from '../buttons/StopSharingButton';
import type { SharedByMeItem } from '../useSharedByMe.store';
import { createItemChecker, mapToLegacyFormat } from './actionsItemsChecker';

interface BaseSharedByMeActionsProps {
    selectedItems: SharedByMeItem[];
    showPreviewModal: ReturnType<typeof usePreviewModal>[1];
    showDetailsModal: ReturnType<typeof useDetailsModal>[1];
    showSharingModal: ReturnType<typeof useSharingModal>['showSharingModal'];
    showRenameModal: ReturnType<typeof useRenameModal>['showRenameModal'];
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
    showPreviewModal,
    showDetailsModal,
    showRenameModal,
    showFilesDetailsModal,
    showSharingModal,
    showConfirmModal,
}: SharedByMeActionsProps) => {
    const itemChecker = createItemChecker(selectedItems);
    const singleItem = selectedItems.at(0);

    const { renameLink } = useActions();

    const hasPreviewAvailable = itemChecker.hasPreviewAvailable(isPreviewAvailable);
    const legacyItems = mapToLegacyFormat(selectedItems);

    const splitedSingleItemUid = singleItem ? splitNodeUid(singleItem?.nodeUid) : undefined;
    if (selectedItems.length === 0) {
        return null;
    }

    const openInDocsInfo = itemChecker.openInDocsInfo;

    const handleOpenDocsOrSheets = (uid: string, openInDocs: OpenInDocsType) => {
        void openDocsOrSheetsDocument({
            uid,
            type: openInDocs.type,
            isNative: openInDocs.isNative,
            openBehavior: 'tab',
        });
    };

    if (buttonType === 'toolbar') {
        return (
            <>
                <ToolbarPreviewButton selectedBrowserItems={legacyItems} />
                {singleItem && openInDocsInfo && (
                    <OpenInDocsOrSheetsButton
                        isNative={openInDocsInfo.isNative}
                        type={openInDocsInfo.type}
                        onClick={() => handleOpenDocsOrSheets(singleItem.nodeUid, openInDocsInfo)}
                        buttonType="toolbar"
                    />
                )}
                {itemChecker.canDownload && <ToolbarDownloadButton selectedBrowserItems={legacyItems} />}
                {itemChecker.canRename && <ToolbarRenameButton selectedLinks={legacyItems} renameLink={renameLink} />}
                <ToolbarDetailsButton selectedBrowserItems={legacyItems} />
                {itemChecker.canShare && splitedSingleItemUid && singleItem && (
                    <>
                        <Vr />
                        <ToolbarShareLinkButton
                            volumeId={splitedSingleItemUid.volumeId}
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
                    nodeUid={singleItem.nodeUid}
                    showPreviewModal={showPreviewModal}
                    close={close}
                />
            )}
            {openInDocsInfo && singleItem && (
                <OpenInDocsOrSheetsButton
                    isNative={openInDocsInfo.isNative}
                    type={openInDocsInfo.type}
                    onClick={() => handleOpenDocsOrSheets(singleItem.nodeUid, openInDocsInfo)}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
            {itemChecker.canDownload && <ContextDownloadButton selectedBrowserItems={legacyItems} close={close} />}
            {itemChecker.canRename && splitedSingleItemUid && singleItem && (
                <RenameActionButton
                    type={'context'}
                    onClick={() =>
                        showRenameModal({
                            nodeUid: singleItem.nodeUid,
                        })
                    }
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
                    linkId={splitedSingleItemUid.nodeId}
                    showSharingModal={showSharingModal}
                    isAlbum={singleItem.type === NodeType.Album}
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

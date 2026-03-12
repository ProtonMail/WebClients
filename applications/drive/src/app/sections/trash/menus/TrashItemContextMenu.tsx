import { NodeType, splitNodeUid } from '@proton/drive';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import { DownloadManager } from '../../../managers/download/DownloadManager';
import type { ContextMenuPosition } from '../../../modules/contextMenu';
import { DetailsButton } from '../../commonButtons/DetailsButton';
import { DownloadButton } from '../../commonButtons/DownloadButton';
import { PreviewButton } from '../../commonButtons/PreviewButton';
import { DeletePermanentlyButton } from '../statelessComponents/DeletePermanentlyButton';
import { RestoreButton } from '../statelessComponents/RestoreButton';
import type { TrashItem } from '../useTrash.store';

interface Props {
    anchorRef: React.RefObject<HTMLElement>;
    isOpen: boolean;
    position: ContextMenuPosition | undefined;
    open: () => void;
    close: () => void;
    selectedItems: TrashItem[];
    onRestore: (items: TrashItem[]) => void;
    onDelete: (items: TrashItem[]) => void;
    onPreview: (props: { deprecatedContextShareId: string; nodeUid: string; canOpenInDocs: boolean }) => void;
    showDetailsModal: (props: { nodeUid: string }) => void;
    showFilesDetailsModal: (props: { selectedItems: { rootShareId: string; linkId: string }[] }) => void;
}

export function TrashItemContextMenu({
    selectedItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    onRestore,
    onDelete,
    onPreview,
    showDetailsModal,
    showFilesDetailsModal,
}: Props) {
    const selectedItem = selectedItems[0];
    const dm = DownloadManager.getInstance();
    const isFileOrPhoto = (item: TrashItem) => item.type === NodeType.File || item.type === NodeType.Photo;

    const hasPreviewAvailable =
        selectedItems.length === 1 &&
        isFileOrPhoto(selectedItem) &&
        selectedItem.mediaType &&
        isPreviewAvailable(selectedItem.mediaType, selectedItem.size);

    const hasDownloadAvailable = selectedItems.every(isFileOrPhoto);
    const handlePreviewClick = () =>
        onPreview({ deprecatedContextShareId: '', nodeUid: selectedItem.uid, canOpenInDocs: false });

    const handleDetailsClick = () => {
        if (selectedItems.length === 1) {
            showDetailsModal({ nodeUid: selectedItem.uid });
        } else {
            showFilesDetailsModal({
                selectedItems: selectedItems.map((item) => ({
                    rootShareId: item.rootShareId ?? '',
                    linkId: splitNodeUid(item.uid).nodeId,
                })),
            });
        }
    };

    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && (
                <PreviewButton buttonType="contextMenu" onClick={handlePreviewClick} close={close} />
            )}
            {hasDownloadAvailable && (
                <DownloadButton
                    buttonType="contextMenu"
                    close={close}
                    onClick={() => dm.download(selectedItems.map((item) => item.uid))}
                />
            )}
            {selectedItem && <DetailsButton buttonType="contextMenu" onClick={handleDetailsClick} close={close} />}
            <RestoreButton buttonType="contextMenu" onClick={() => onRestore(selectedItems)} close={close} />
            <DeletePermanentlyButton buttonType="contextMenu" onClick={() => onDelete(selectedItems)} close={close} />
        </ItemContextMenu>
    );
}

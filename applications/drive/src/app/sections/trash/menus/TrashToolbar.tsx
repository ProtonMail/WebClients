import { Vr } from '@proton/atoms/Vr/Vr';
import { Toolbar } from '@proton/components';
import { NodeType, splitNodeUid } from '@proton/drive';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DownloadManager } from '../../../managers/download/DownloadManager';
import { useSelectionStore } from '../../../modules/selection';
import { DetailsButton } from '../../commonButtons/DetailsButton';
import { DownloadButton } from '../../commonButtons/DownloadButton';
import { PreviewButton } from '../../commonButtons/PreviewButton';
import { LayoutToolbarButton } from '../../folders/buttons/LayoutButton';
import { DeletePermanentlyButton } from '../statelessComponents/DeletePermanentlyButton';
import { RestoreButton } from '../statelessComponents/RestoreButton';
import type { TrashItem } from '../useTrash.store';
import { useTrashStore } from '../useTrash.store';

interface Props {
    onRestore: (items: TrashItem[]) => void;
    onDelete: (items: TrashItem[]) => void;
    onPreview: (props: { deprecatedContextShareId: string; nodeUid: string; canOpenInDocs: boolean }) => void;
    showDetailsModal: (props: { nodeUid: string }) => void;
    showFilesDetailsModal: (props: { selectedItems: { rootShareId: string; linkId: string }[] }) => void;
}

export const TrashToolbar = ({ onRestore, onDelete, onPreview, showDetailsModal, showFilesDetailsModal }: Props) => {
    const selectedItemIds = useSelectionStore((state) => Array.from(state.selectedItemIds));
    const selectedItems = selectedItemIds
        .map((id) => useTrashStore.getState().getItem(id))
        .filter((item) => item !== undefined);
    const selectedItem = selectedItems[0];
    const isFileOrPhoto = (item: TrashItem) => item.type === NodeType.File || item.type === NodeType.Photo;

    const dm = DownloadManager.getInstance();
    const handlePreviewClick = () =>
        onPreview({ deprecatedContextShareId: '', nodeUid: selectedItem.uid, canOpenInDocs: false });

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        const hasPreview =
            selectedItems.length === 1 &&
            isFileOrPhoto(selectedItem) &&
            selectedItem.mediaType &&
            isPreviewAvailable(selectedItem.mediaType, selectedItem.size);

        const hasDownload = selectedItems.every(isFileOrPhoto);

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
            <>
                {hasPreview && <PreviewButton buttonType="toolbar" onClick={handlePreviewClick} />}
                {hasDownload && (
                    <DownloadButton
                        buttonType="toolbar"
                        onClick={() => dm.download(selectedItems.map((item) => item.uid))}
                    />
                )}
                <Vr className="section-toolbar--hide-alone" />
                {selectedItem && <DetailsButton buttonType="toolbar" onClick={handleDetailsClick} />}
                <Vr />
                <RestoreButton buttonType="toolbar" onClick={() => onRestore(selectedItems)} />
                <DeletePermanentlyButton buttonType="toolbar" onClick={() => onDelete(selectedItems)} />
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap shrink-0">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap shrink-0">
                {selectedItems.length > 0 && <Vr className="hidden lg:flex mx-2" />}
                <LayoutToolbarButton />
            </span>
        </Toolbar>
    );
};

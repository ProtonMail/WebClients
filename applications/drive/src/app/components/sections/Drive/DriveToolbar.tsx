import { getDevice } from '@proton/shared/lib/helpers/browser';
import { ToolbarSeparator, Toolbar, useActiveBreakpoint } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    PreviewButton,
    RenameButton,
    ShareButton,
    ShareFileButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import {
    ActionsDropdown,
    CreateNewFolderButton,
    MoveToTrashButton,
    MoveToFolderButton,
    UploadFileButton,
    UploadFolderButton,
} from './ToolbarButtons';
interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
    showOptionsForNoSelection?: boolean;
}

const DriveToolbar = ({ shareId, selectedItems, showOptionsForNoSelection = true }: Props) => {
    const isDesktop = !getDevice()?.type;
    const { isNarrow } = useActiveBreakpoint();

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            if (!showOptionsForNoSelection) {
                return null;
            }
            return (
                <>
                    <CreateNewFolderButton />
                    {isDesktop && (
                        <>
                            <ToolbarSeparator />
                            <UploadFolderButton />
                            <UploadFileButton />
                        </>
                    )}
                    <ToolbarSeparator />
                    <ShareFileButton shareId={shareId} />
                </>
            );
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedItems={selectedItems} />
                <ToolbarSeparator />
                <DownloadButton shareId={shareId} selectedItems={selectedItems} />
                {isNarrow ? (
                    <ActionsDropdown shareId={shareId} selectedItems={selectedItems} />
                ) : (
                    <>
                        <ShareButton shareId={shareId} selectedItems={selectedItems} />
                        <ShareLinkButton shareId={shareId} selectedItems={selectedItems} />
                        <ToolbarSeparator />
                        <MoveToFolderButton shareId={shareId} selectedItems={selectedItems} />
                        <RenameButton shareId={shareId} selectedItems={selectedItems} />
                        <DetailsButton shareId={shareId} selectedItems={selectedItems} />
                        <ToolbarSeparator />
                        <MoveToTrashButton shareId={shareId} selectedItems={selectedItems} />
                    </>
                )}
            </>
        );
    };

    return (
        <Toolbar>
            {renderSelectionActions()}
            <span className="mlauto flex flex-nowrap">
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default DriveToolbar;

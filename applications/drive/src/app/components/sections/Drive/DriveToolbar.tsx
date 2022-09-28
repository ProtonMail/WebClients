import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar, useActiveBreakpoint } from '@proton/components';
import { getDevice } from '@proton/shared/lib/helpers/browser';

import { DecryptedLink } from '../../../store';
import { useSelection } from '../../FileBrowser';
import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    PreviewButton,
    RenameButton,
    ShareFileButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import { getSelectedItems } from '../helpers';
import useIsEditEnabled from '../useIsEditEnabled';
import {
    ActionsDropdown,
    CreateNewFileButton,
    CreateNewFolderButton,
    MoveToFolderButton,
    MoveToTrashButton,
    UploadFileButton,
    UploadFolderButton,
} from './ToolbarButtons';

interface Props {
    shareId: string;
    items: DecryptedLink[];
    showOptionsForNoSelection?: boolean;
}

const DriveToolbar = ({ shareId, items, showOptionsForNoSelection = true }: Props) => {
    const isDesktop = !getDevice()?.type;
    const { isNarrow } = useActiveBreakpoint();
    const selectionControls = useSelection()!;
    const isEditEnabled = useIsEditEnabled();

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            if (!showOptionsForNoSelection) {
                return null;
            }
            return (
                <>
                    <CreateNewFolderButton />
                    {isEditEnabled && <CreateNewFileButton />}
                    {isDesktop && (
                        <>
                            <Vr />
                            <UploadFolderButton />
                            <UploadFileButton />
                        </>
                    )}
                    <Vr />
                    <ShareFileButton shareId={shareId} />
                </>
            );
        }

        return (
            <>
                <PreviewButton selectedLinks={selectedItems} />
                <DownloadButton selectedLinks={selectedItems} />
                {isNarrow ? (
                    <ActionsDropdown shareId={shareId} selectedLinks={selectedItems} />
                ) : (
                    <>
                        <ShareLinkButton selectedLinks={selectedItems} />
                        <Vr />
                        <MoveToFolderButton shareId={shareId} selectedLinks={selectedItems} />
                        <RenameButton selectedLinks={selectedItems} />
                        <DetailsButton selectedLinks={selectedItems} />
                        <Vr />
                        <MoveToTrashButton selectedLinks={selectedItems} />
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

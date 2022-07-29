import { useMemo } from 'react';

import { getDevice } from '@proton/shared/lib/helpers/browser';
import { Toolbar, useActiveBreakpoint } from '@proton/components';
import { Vr } from '@proton/atoms';

import { DecryptedLink } from '../../../store';
import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    PreviewButton,
    RenameButton,
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
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../helpers';

interface Props {
    shareId: string;
    items: DecryptedLink[];
    showOptionsForNoSelection?: boolean;
}

const DriveToolbar = ({ shareId, items, showOptionsForNoSelection = true }: Props) => {
    const isDesktop = !getDevice()?.type;
    const { isNarrow } = useActiveBreakpoint();
    const selectionControls = useSelection()!;

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
                <PreviewButton shareId={shareId} selectedLinks={selectedItems} />
                <DownloadButton shareId={shareId} selectedLinks={selectedItems} />
                {isNarrow ? (
                    <ActionsDropdown shareId={shareId} selectedLinks={selectedItems} />
                ) : (
                    <>
                        <ShareLinkButton shareId={shareId} selectedLinks={selectedItems} />
                        <Vr />
                        <MoveToFolderButton shareId={shareId} selectedLinks={selectedItems} />
                        <RenameButton shareId={shareId} selectedLinks={selectedItems} />
                        <DetailsButton shareId={shareId} linkIds={selectedItems.map(({ linkId }) => linkId)} />
                        <Vr />
                        <MoveToTrashButton shareId={shareId} selectedLinks={selectedItems} />
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

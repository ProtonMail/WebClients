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
    ShareButton,
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
    linkId: string;
    items: DecryptedLink[];
    showOptionsForNoSelection?: boolean;
    isLinkReadOnly?: boolean;
}

const DriveToolbar = ({ shareId, items, showOptionsForNoSelection = true, isLinkReadOnly }: Props) => {
    const isDesktop = !getDevice()?.type;
    const { isNarrow } = useActiveBreakpoint();
    const selectionControls = useSelection()!;
    const isEditEnabled = useIsEditEnabled();

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const shouldShowShareButton = !isLinkReadOnly || items.length > 0;

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            if (!showOptionsForNoSelection) {
                return null;
            }
            return (
                <>
                    {!isLinkReadOnly ? (
                        <>
                            <CreateNewFolderButton />
                            {isEditEnabled && <CreateNewFileButton />}
                            <Vr />
                            {isDesktop && <UploadFolderButton />}
                            <UploadFileButton />
                            <Vr />
                        </>
                    ) : null}

                    {shouldShowShareButton && <ShareButton shareId={shareId} />}
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
                        {!isLinkReadOnly ? (
                            <>
                                <MoveToFolderButton shareId={shareId} selectedLinks={selectedItems} />
                                <RenameButton selectedLinks={selectedItems} />
                            </>
                        ) : null}
                        <DetailsButton selectedLinks={selectedItems} />
                        {!isLinkReadOnly ? (
                            <>
                                <Vr />
                                <MoveToTrashButton selectedLinks={selectedItems} />
                            </>
                        ) : null}
                    </>
                )}
            </>
        );
    };

    return (
        <Toolbar>
            {renderSelectionActions()}
            <span className="ml-auto flex flex-nowrap">
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default DriveToolbar;

import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import { DecryptedLink } from '../../../store';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../helpers';
import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    PreviewButton,
    RenameButton,
    ShareFileButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import { StopSharingButton } from './ToolbarButtons';

interface Props {
    shareId: string;
    items: DecryptedLink[];
}

const SharedLinksToolbar = ({ shareId, items }: Props) => {
    const selectionControls = useSelection()!;

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return (
                <>
                    <ShareFileButton shareId={shareId} />
                </>
            );
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedLinks={selectedItems} />
                <DownloadButton shareId={shareId} selectedLinks={selectedItems} />
                <Vr />
                <RenameButton shareId={shareId} selectedLinks={selectedItems} />
                <DetailsButton shareId={shareId} linkIds={selectionControls.selectedItemIds} />
                <Vr />
                <ShareLinkButton shareId={shareId} selectedLinks={selectedItems} />
                <StopSharingButton shareId={shareId} selectedLinks={selectedItems} />
            </>
        );
    };

    return (
        <Toolbar>
            {renderSelectionActions()}
            <span className="mlauto flex">
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default SharedLinksToolbar;

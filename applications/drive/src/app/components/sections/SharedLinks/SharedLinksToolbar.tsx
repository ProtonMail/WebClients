import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

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
                    <ShareButton shareId={shareId} />
                </>
            );
        }

        return (
            <>
                <PreviewButton selectedLinks={selectedItems} />
                <DownloadButton selectedLinks={selectedItems} />
                <Vr />
                <RenameButton selectedLinks={selectedItems} />
                <DetailsButton selectedLinks={selectedItems} />
                <Vr />
                <ShareLinkButton selectedLinks={selectedItems} />
                <StopSharingButton selectedLinks={selectedItems} />
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap flex-item-noshrink">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap flex-item-noshrink">
                <Vr className="hidden lg:flex mx-2" />
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default SharedLinksToolbar;

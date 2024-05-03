import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import { DecryptedLink, useDriveSharingFeatureFlag } from '../../../store';
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
import ShareLinkButtonLEGACY from '../ToolbarButtons/_legacy/ShareLinkButtonLEGACY';
import { getSelectedItems } from '../helpers';
import { StopSharingButton } from './ToolbarButtons';
import StopSharingButtonLEGACY from './ToolbarButtons/_legacy/StopSharingButtonLEGACY';

interface Props {
    shareId: string;
    items: DecryptedLink[];
}

const SharedLinksToolbar = ({ shareId, items }: Props) => {
    const selectionControls = useSelection()!;
    const driveSharing = useDriveSharingFeatureFlag();

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );
    const isOnlyOneItem = selectedItems.length === 1;

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
                {isOnlyOneItem && <Vr />}
                {driveSharing ? (
                    <ShareLinkButton selectedLinks={selectedItems} />
                ) : (
                    <ShareLinkButtonLEGACY selectedLinks={selectedItems} />
                )}
                {/* //TODO: Add multiple share deletion support */}
                {driveSharing ? (
                    <StopSharingButton selectedLinks={selectedItems} />
                ) : (
                    <StopSharingButtonLEGACY selectedLinks={selectedItems} />
                )}
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap shrink-0">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap shrink-0">
                <Vr className="hidden lg:flex mx-2" />
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default SharedLinksToolbar;

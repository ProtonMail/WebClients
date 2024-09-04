import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import { useSelection } from '../../FileBrowser';
import { DetailsButton, DownloadButton, LayoutButton, OpenInDocsButton, PreviewButton } from '../ToolbarButtons';
import { hasBookmarkSelected, hasInvitationSelected, isMultiSelect } from '../ToolbarButtons/utils';
import { getSelectedSharedWithMeItems } from '../helpers';
import type { SharedWithMeItem } from './SharedWithMe';
import { OpenBookmarkButton } from './ToolbarButtons/OpenBookmarkButton';
import { RemoveBookmarkButton } from './ToolbarButtons/RemoveBookmarkButton';
import { RemoveMeButton } from './ToolbarButtons/RemoveMeButton';

interface Props {
    shareId: string;
    items: SharedWithMeItem[];
}

const SharedWithMeToolbar = ({ items }: Props) => {
    const selectionControls = useSelection()!;

    const selectedItems = useMemo(
        () => getSelectedSharedWithMeItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const renderSelectionActions = () => {
        if (hasInvitationSelected(selectedItems)) {
            return;
        }
        if (hasBookmarkSelected(selectedItems)) {
            return (
                <>
                    <OpenBookmarkButton selectedBrowserItems={selectedItems} />
                    <RemoveBookmarkButton selectedBrowserItems={selectedItems} />
                </>
            );
        }
        return (
            <>
                <PreviewButton selectedBrowserItems={selectedItems} />
                <OpenInDocsButton selectedBrowserItems={selectedItems} />
                <DownloadButton selectedBrowserItems={selectedItems} />
                <DetailsButton selectedBrowserItems={selectedItems} />
                {!isMultiSelect(selectedItems) ? <Vr /> : null}
                <RemoveMeButton selectedBrowserItems={selectedItems} />
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap shrink-0">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap shrink-0">
                {selectedItems.length ? <Vr className="hidden lg:flex mx-2" /> : null}
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default SharedWithMeToolbar;

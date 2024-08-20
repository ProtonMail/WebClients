import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import { useSelection } from '../../FileBrowser';
import { DetailsButton, DownloadButton, LayoutButton, OpenInDocsButton, PreviewButton } from '../ToolbarButtons';
import { getSelectedSharedWithMeItems } from '../helpers';
import type { SharedWithMeItem } from './SharedWithMe';

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
        const haveInvitationInSelection = selectedItems.find((selectedItem) => selectedItem.isInvitation);
        if (haveInvitationInSelection) {
            return;
        }
        return (
            <>
                <PreviewButton selectedBrowserItems={selectedItems} />
                <OpenInDocsButton selectedBrowserItems={selectedItems} />
                <DownloadButton selectedBrowserItems={selectedItems} />
                {selectedItems.length ? <Vr /> : null}
                <DetailsButton selectedBrowserItems={selectedItems} />
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

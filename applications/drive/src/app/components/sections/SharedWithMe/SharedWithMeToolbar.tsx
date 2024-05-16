import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import { DecryptedLink } from '../../../store';
import { useSelection } from '../../FileBrowser';
import { DetailsButton, DownloadButton, LayoutButton, OpenInDocsButton, PreviewButton } from '../ToolbarButtons';
import { getSelectedItems } from '../helpers';

interface Props {
    shareId: string;
    items: DecryptedLink[];
}

const SharedWithMeToolbar = ({ shareId, items }: Props) => {
    const selectionControls = useSelection()!;

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const renderSelectionActions = () => {
        return (
            <>
                <PreviewButton selectedLinks={selectedItems} />
                <OpenInDocsButton shareId={shareId} selectedLinks={selectedItems} />
                <DownloadButton selectedLinks={selectedItems} />
                {selectedItems.length ? <Vr /> : null}
                <DetailsButton selectedLinks={selectedItems} />
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

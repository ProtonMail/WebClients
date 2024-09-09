import { useMemo } from 'react';

import { Toolbar } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import type { Device } from '../../../../store';
import { useSelection } from '../../../FileBrowser';
import { LayoutButton } from '../../ToolbarButtons';
import DesktopDownloadDropdown from '../../ToolbarButtons/DesktopDownloadDropdown';
import { RemoveButton, RenameButton } from './buttons';

interface Props {
    items: Device[];
}

export const getSelectedItems = (items: Device[], selectedItemIds: string[]): Device[] => {
    if (items) {
        return selectedItemIds.map((selectedItemId) => items.find(({ id }) => selectedItemId === id)).filter(isTruthy);
    }

    return [];
};

const DevicesToolbar = ({ items }: Props) => {
    const selectionControls = useSelection()!;
    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <>
                <RenameButton selectedDevices={selectedItems} />
                <RemoveButton selectedDevices={selectedItems} />
            </>
        );
    };
    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap">
                <DesktopDownloadDropdown className="self-center mr-2" />
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default DevicesToolbar;

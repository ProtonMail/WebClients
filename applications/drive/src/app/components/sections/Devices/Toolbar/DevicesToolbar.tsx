import { useMemo } from 'react';

import { Toolbar } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import { Device } from '../../../../store';
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
        <Toolbar>
            {renderSelectionActions()}
            <span className="ml-auto flex flex-nowrap">
                <DesktopDownloadDropdown className="flex-align-self-center mr-2" />
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default DevicesToolbar;

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { isMultiSelect, noSelection } from '../../../components/sections/ToolbarButtons/utils';
import type { FolderButtonProps } from './types';

type Item = {
    uid: string;
    isFile: boolean;
    name: string;
    mimeType: string;
    volumeId: string;
    linkId: string;
    rootShareId: string;
};

type Props = FolderButtonProps & {
    selectedItems: Item[];
};

export const RenameButton = ({ selectedItems, onClick, type, close }: Props) => {
    if (noSelection(selectedItems) || isMultiSelect(selectedItems)) {
        return null;
    }

    const title = c('Action').t`Rename`;
    const icon = 'pen-square' as const;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-rename"
            />
        );
    }
    if (type === 'context') {
        return (
            <ContextMenuButton name={title} icon={icon} testId="context-menu-rename" action={onClick} close={close} />
        );
    }
};

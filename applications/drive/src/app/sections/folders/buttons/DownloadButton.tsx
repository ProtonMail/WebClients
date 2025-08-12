import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { hasFoldersSelected, noSelection } from '../../../components/sections/ToolbarButtons/utils';
import { type FolderButtonProps } from './types';

type Item = {
    uid: string;
    name: string;
    isFile: boolean;
};

type Props = FolderButtonProps & {
    selectedItems: Item[];
    disabledFolders?: boolean;
};

export const DownloadButton = ({ selectedItems, onClick, type, close, disabledFolders }: Props) => {
    if (noSelection(selectedItems) || (disabledFolders && hasFoldersSelected(selectedItems))) {
        return null;
    }

    const title = c('Action').t`Download`;
    const icon = 'arrow-down-line' as const;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-download"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton name={title} icon={icon} testId="context-menu-download" action={onClick} close={close} />
        );
    }
};

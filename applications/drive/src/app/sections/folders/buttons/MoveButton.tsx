import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { noSelection } from '../../../components/sections/ToolbarButtons/utils';
import type { FolderButtonProps } from './types';

type Item = {
    uid: string;
    isFile: boolean;
    name: string;
    mimeType: string;
    volumeId: string;
    linkId: string;
    parentLinkId: string;
    rootShareId: string;
};

type Props = FolderButtonProps & {
    selectedItems: Item[];
};

export const MoveButton = ({ selectedItems, type, onClick }: Props) => {
    if (noSelection(selectedItems)) {
        return null;
    }
    const title = c('Action').t`Move to folder`;
    const icon = 'arrows-cross' as const;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-move"
            />
        );
    }

    if (type === 'context') {
        return <ContextMenuButton name={title} icon={icon} testId="context-menu-move" action={onClick} close={close} />;
    }
};

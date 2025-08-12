import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { noSelection } from '../../../components/sections/ToolbarButtons/utils';
import { type FolderButtonProps } from './types';

type Item = {
    uid: string;
    name: string;
};

type Props = FolderButtonProps & {
    selectedItems: Item[];
};

export const DetailsButton = ({ selectedItems, onClick, type, close }: Props) => {
    if (noSelection(selectedItems)) {
        return null;
    }

    const title = c('Action').t`Details`;
    const icon = 'info-circle' as const;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-details"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton name={title} icon={icon} testId="context-menu-details" action={onClick} close={close} />
        );
    }
};

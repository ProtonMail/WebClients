import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { isMultiSelect, noSelection } from '../../../components/sections/ToolbarButtons/utils';
import { type FolderButtonProps } from './types';

type Item = {
    uid: string;
    name: string;
};

type Props = FolderButtonProps & {
    selectedItems: Item[];
};

export const ShareLinkButton = ({ selectedItems, onClick, type, close }: Props) => {
    if (noSelection(selectedItems) || isMultiSelect(selectedItems)) {
        return null;
    }

    const title = c('Action').t`Share`;
    const icon = 'user-plus' as const;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-share-link"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-share-link"
                action={onClick}
                close={close}
            />
        );
    }
};

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { noSelection } from '../../../components/sections/ToolbarButtons/utils';
import { useTrashActions } from '../../commonActions/useTrashActions';
import type { FolderButtonProps } from './types';

type Item = {
    uid: string;
    name: string;
    parentUid: string | undefined;
};

type Props = Omit<FolderButtonProps, 'onClick'> & {
    selectedItems: Item[];
};

export const TrashButton = ({ selectedItems, type, close }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { trashItems } = useTrashActions();

    if (noSelection(selectedItems)) {
        return null;
    }

    const title = c('Action').t`Move to trash`;
    const icon = 'trash' as const;

    const handleClick = () => {
        void withLoading(trashItems(selectedItems));
    };

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                disabled={isLoading}
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={handleClick}
                data-testid="toolbar-trash"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-trash"
                action={handleClick}
                close={() => close?.()}
            />
        );
    }
};

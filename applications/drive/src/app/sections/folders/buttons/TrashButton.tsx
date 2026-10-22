import { c } from 'ttag';

import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';
import { type NodeType, getDrivePerNodeType } from '@proton/drive/sdk';
import useLoading from '@proton/hooks/useLoading';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import { noSelection } from '../../../legacy/components/sections/ToolbarButtons/utils';
import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';
import { useTrashActions } from '../../commonActions/useTrashActions';

type Item = {
    uid: string;
    name: string;
    parentUid: string | undefined;
    type: NodeType;
};

type Props = Omit<ActionButtonProps, 'onClick'> & {
    selectedItems: Item[];
};

export const TrashButton = ({ selectedItems, type, close }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { trashItems } = useTrashActions();

    if (noSelection(selectedItems)) {
        return null;
    }

    const title = c('Action').t`Move to trash`;

    const handleClick = () => {
        void withLoading(async () => {
            const itemsByDrive = Map.groupBy(selectedItems, (item) => getDrivePerNodeType(item.type));
            await Promise.all([...itemsByDrive.entries()].map(([drive, items]) => trashItems(drive, items)));
        });
    };

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                disabled={isLoading}
                title={title}
                icon={<IcTrash alt={title} />}
                onClick={handleClick}
                data-testid="toolbar-trash"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcTrash />}
                testId="context-menu-trash"
                action={handleClick}
                close={() => close?.()}
            />
        );
    }
};

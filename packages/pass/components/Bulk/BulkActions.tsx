import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { type BulkSelection, useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import type { ItemIdsByShareId } from '@proton/pass/types';

const normalizeBulkSelection = (selection: BulkSelection): ItemIdsByShareId =>
    Object.fromEntries(
        Array.from(selection.entries()).map(([shareId, itemIds]) => [shareId, Array.from(itemIds?.values() ?? [])])
    );

export const BulkActions: FC = () => {
    const { matchTrash } = useNavigation();
    const { selection } = useBulkSelect();
    const { moveMany } = useItemsActions();

    return matchTrash ? (
        <>
            <Button shape="solid" size="small" color="weak" icon title={c('Action').t`Bulk restore items from trash`}>
                <Icon name="clock-rotate-left" />
            </Button>
            <Button shape="solid" size="small" color="weak" icon title={c('Action').t`Bulk delete items from trash`}>
                <Icon name="trash-cross" />
            </Button>
        </>
    ) : (
        <>
            <Button
                shape="solid"
                size="small"
                color="weak"
                icon
                onClick={() => moveMany(normalizeBulkSelection(selection))}
                title={c('Action').t`Bulk move items to another vault`}
            >
                <Icon name="folder-arrow-in" />
            </Button>
            <Button shape="solid" size="small" color="weak" icon title={c('Action').t`Bulk move items to trash`}>
                <Icon name="trash" />
            </Button>
        </>
    );
};

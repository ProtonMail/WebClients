import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { type BulkSelection, useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import type { BulkSelectionDTO } from '@proton/pass/types';

const bulkSelectionDTO = (selection: BulkSelection): BulkSelectionDTO =>
    Array.from(selection.keys()).reduce<BulkSelectionDTO>((dto, shareId) => {
        dto[shareId] = {};
        selection.get(shareId)?.forEach((itemId) => {
            dto[shareId][itemId] = true;
        });

        return dto;
    }, {});

export const BulkActions: FC = () => {
    const { matchTrash } = useNavigation();
    const { selection } = useBulkSelect();
    const { moveMany, trashMany } = useItemsActions();

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
                onClick={() => moveMany(bulkSelectionDTO(selection))}
                title={c('Action').t`Bulk move items to another vault`}
            >
                <Icon name="folder-arrow-in" />
            </Button>
            <Button
                shape="solid"
                size="small"
                color="weak"
                icon
                title={c('Action').t`Bulk move items to trash`}
                onClick={() => trashMany(bulkSelectionDTO(selection))}
            >
                <Icon name="trash" />
            </Button>
        </>
    );
};

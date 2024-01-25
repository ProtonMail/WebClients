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

type Props = { disabled?: boolean };

export const BulkActions: FC<Props> = (props) => {
    const { matchTrash } = useNavigation();
    const { selection, count } = useBulkSelect();
    const disabled = count === 0 || props.disabled;

    const { moveMany, trashMany, deleteMany, restoreMany } = useItemsActions();

    return matchTrash ? (
        <>
            <Button
                color="weak"
                disabled={disabled}
                icon
                onClick={() => restoreMany(bulkSelectionDTO(selection))}
                shape="solid"
                size="small"
                title={c('Action').t`Bulk restore items from trash`}
            >
                <Icon name="clock-rotate-left" />
            </Button>
            <Button
                color="weak"
                disabled={disabled}
                icon
                onClick={() => deleteMany(bulkSelectionDTO(selection))}
                shape="solid"
                size="small"
                title={c('Action').t`Bulk delete items from trash`}
            >
                <Icon name="trash-cross" />
            </Button>
        </>
    ) : (
        <>
            <Button
                color="weak"
                disabled={disabled}
                icon
                onClick={() => moveMany(bulkSelectionDTO(selection))}
                shape="solid"
                size="small"
                title={c('Action').t`Bulk move items to another vault`}
            >
                <Icon name="folder-arrow-in" />
            </Button>
            <Button
                color="weak"
                disabled={disabled}
                icon
                onClick={() => trashMany(bulkSelectionDTO(selection))}
                shape="solid"
                size="small"
                title={c('Action').t`Bulk move items to trash`}
            >
                <Icon name="trash" />
            </Button>
        </>
    );
};

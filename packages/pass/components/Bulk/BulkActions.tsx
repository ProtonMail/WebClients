import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
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
                onClick={() => restoreMany(bulkSelectionDTO(selection))}
                shape="solid"
                size="small"
                title={c('Action').t`Bulk restore items from trash`}
                className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold"
            >
                <Icon name="clock-rotate-left" className="shrink-0" />
                <span className="text-ellipsis hidden xl:block">{c('Action').t`Restore`}</span>
            </Button>
            <Button
                color="weak"
                disabled={disabled}
                onClick={() => deleteMany(bulkSelectionDTO(selection))}
                shape="solid"
                size="small"
                title={c('Action').t`Bulk delete items from trash`}
                className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold"
            >
                <Icon name="trash-cross" className="shrink-0" />
                <span className="text-ellipsis hidden xl:block">{c('Action').t`Delete`}</span>
            </Button>
        </>
    ) : (
        <>
            <Button
                color="weak"
                disabled={disabled}
                onClick={() => moveMany(bulkSelectionDTO(selection))}
                shape="solid"
                size="small"
                title={c('Action').t`Bulk move items to another vault`}
                className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold"
            >
                <Icon name="folder-arrow-in" className="shrink-0" />
                <span className="text-ellipsis hidden xl:block">{c('Action').t`Move`}</span>
            </Button>
            <Button
                color="weak"
                disabled={disabled}
                onClick={() => trashMany(bulkSelectionDTO(selection))}
                shape="solid"
                size="small"
                title={c('Action').t`Bulk move items to trash`}
                className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold"
            >
                <Icon name="trash" className="shrink-0" />
                <span className="text-ellipsis hidden xl:block">{c('Action').t`Trash`}</span>
            </Button>
        </>
    );
};

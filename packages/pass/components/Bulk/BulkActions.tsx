import { memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { useBulkSelection } from '@proton/pass/components/Bulk/BulkSelectionState';
import { bulkSelectionDTO } from '@proton/pass/components/Bulk/utils';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';

type Props = { disabled?: boolean };

export const BulkActions = memo((props: Props) => {
    const scope = useItemScope();
    const { selection, count } = useBulkSelection();
    const disabled = count === 0 || props.disabled;

    const { moveMany, trashMany, deleteMany, restoreMany } = useItemsActions();

    return scope === 'trash' ? (
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
});

BulkActions.displayName = 'BulkActionsMemo';

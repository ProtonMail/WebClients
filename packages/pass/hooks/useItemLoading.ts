import { useSelector } from 'react-redux';

import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { itemDelete, itemMove, itemRestore, itemTrash } from '@proton/pass/store/actions';
import {
    itemsBulkDeleteRequest,
    itemsBulkMoveRequest,
    itemsBulkRestoreRequest,
    itemsBulkTrashRequest,
    trashEmptyRequest,
    trashRestoreRequest,
    vaultMoveAllItemsRequest,
} from '@proton/pass/store/actions/requests';
import { selectRequestInFlight, selectRequestInFlightData } from '@proton/pass/store/selectors';
import type { BulkSelectionDTO, ItemRevision, MaybeNull, SelectedItem } from '@proton/pass/types';

const bulkSelectionContains =
    ({ shareId, itemId }: SelectedItem) =>
    (dto: MaybeNull<BulkSelectionDTO>) =>
        dto?.[shareId]?.[itemId] ?? false;

export const useItemLoading = (item: ItemRevision) => {
    const trashing = useSelector(selectRequestInFlight(itemTrash.requestID(item)));
    const moving = useSelector(selectRequestInFlight(itemMove.requestID(item)));
    const restoring = useSelector(selectRequestInFlight(itemRestore.requestID(item)));
    const deleting = useSelector(selectRequestInFlight(itemDelete.requestID(item)));

    const bulkMoveDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkMoveRequest()));
    const bulkTrashDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkTrashRequest()));
    const bulkRestoreDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkRestoreRequest()));
    const bulkRemoveDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkDeleteRequest()));

    const trashed = isTrashed(item);
    const emptyingTrash = useSelector(selectRequestInFlight(trashEmptyRequest())) && trashed;
    const restoringTrash = useSelector(selectRequestInFlight(trashRestoreRequest())) && trashed;
    const movingVault = Boolean(useSelector(selectRequestInFlight(vaultMoveAllItemsRequest(item.shareId))));

    const inBulk = bulkSelectionContains(item);

    return (
        trashing ||
        moving ||
        restoring ||
        deleting ||
        emptyingTrash ||
        restoringTrash ||
        movingVault ||
        inBulk(bulkTrashDTO) ||
        inBulk(bulkMoveDTO) ||
        inBulk(bulkRestoreDTO) ||
        inBulk(bulkRemoveDTO)
    );
};

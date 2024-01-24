import { useSelector } from 'react-redux';

import { isTrashed } from '@proton/pass/lib/items/item.predicates';
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

export const useBulkInFlight = (item: ItemRevision) => {
    const bulkMoveDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkMoveRequest()));
    const bulkTrashDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkTrashRequest()));
    const bulkRestoreDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkRestoreRequest()));
    const bulkRemoveDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkDeleteRequest()));

    const trashed = isTrashed(item);
    const trashEmptyInFlight = useSelector(selectRequestInFlight(trashEmptyRequest())) && trashed;
    const trashRestoreInFlight = useSelector(selectRequestInFlight(trashRestoreRequest())) && trashed;
    const vaultMoveInFlight = Boolean(useSelector(selectRequestInFlight(vaultMoveAllItemsRequest(item.shareId))));

    const inBulk = bulkSelectionContains(item);

    return (
        trashEmptyInFlight ||
        trashRestoreInFlight ||
        vaultMoveInFlight ||
        inBulk(bulkTrashDTO) ||
        inBulk(bulkMoveDTO) ||
        inBulk(bulkRestoreDTO) ||
        inBulk(bulkRemoveDTO)
    );
};

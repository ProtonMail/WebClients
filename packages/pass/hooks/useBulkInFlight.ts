import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { itemsBulkMoveRequest, itemsBulkTrashRequest, vaultMoveAllItemsRequest } from '../store/actions/requests';
import { selectRequestInFlight, selectRequestInFlightData } from '../store/selectors';
import type { BulkSelectionDTO, MaybeNull, SelectedItem } from '../types';

const bulkSelectionContains =
    ({ shareId, itemId }: SelectedItem) =>
    (dto: MaybeNull<BulkSelectionDTO>) =>
        dto?.[shareId]?.[itemId] ?? false;

export const useBulkInFlight = (item: SelectedItem) => {
    const bulkMoveDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkMoveRequest()));
    const bulkTrashDTO = useSelector(selectRequestInFlightData<BulkSelectionDTO>(itemsBulkTrashRequest()));
    const vaultMoveInFlight = Boolean(useSelector(selectRequestInFlight(vaultMoveAllItemsRequest(item.shareId))));

    return useMemo<boolean>(() => {
        const inBulk = bulkSelectionContains(item);
        return vaultMoveInFlight || inBulk(bulkTrashDTO) || inBulk(bulkMoveDTO);
    }, [bulkTrashDTO, bulkMoveDTO, vaultMoveInFlight]);
};

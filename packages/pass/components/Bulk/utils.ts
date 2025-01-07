import type { BulkSelection } from '@proton/pass/components/Bulk/types';
import type { BulkSelectionDTO } from '@proton/pass/types';

export const bulkSelectionDTO = (selection: BulkSelection): BulkSelectionDTO =>
    Array.from(selection.keys()).reduce<BulkSelectionDTO>((dto, shareId) => {
        dto[shareId] = {};
        selection.get(shareId)?.forEach((itemId) => {
            dto[shareId][itemId] = true;
        });

        return dto;
    }, {});

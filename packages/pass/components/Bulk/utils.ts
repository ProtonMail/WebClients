import type { BulkSelectionDTO } from '../../types/data/items.dto';
import type { BulkSelection } from './types';

export const bulkSelectionDTO = (selection: BulkSelection): BulkSelectionDTO =>
    Array.from(selection.keys()).reduce<BulkSelectionDTO>((dto, shareId) => {
        dto[shareId] = {};
        selection.get(shareId)?.forEach((itemId) => {
            dto[shareId][itemId] = true;
        });

        return dto;
    }, {});

import { c } from 'ttag';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { dateComparator, stringComparator } from '../../../modules/sorting/comparators';
import { SortField } from '../../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../../statelessComponents/DriveExplorer/types';

export const deletedTimeCellConfig: CellDefinitionConfig = {
    id: 'deleted',
    headerText: c('Label').t`Deleted`,
    className: 'w-1/6',
    sortField: SortField.trashedTime,
    sortConfig: [
        { field: SortField.trashedTime, comparator: dateComparator },
        { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.ASC },
    ],
    testId: 'column-deleted',
};

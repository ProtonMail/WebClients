import { c } from 'ttag';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { dateComparator, stringComparator } from '../../modules/sorting/comparators';
import { SortField } from '../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../statelessComponents/DriveExplorer/types';

export const defaultModifiedTimeCellConfig: CellDefinitionConfig = {
    id: 'modified',
    headerText: c('Label').t`Modified`,
    className: 'w-1/6',
    sortField: SortField.modificationTime,
    sortConfig: [
        { field: SortField.modificationTime, comparator: dateComparator },
        { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.ASC },
    ],
    testId: 'column-modified',
};

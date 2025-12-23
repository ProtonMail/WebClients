import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { numberComparator } from '../../../modules/sorting/comparators';
import { SortField } from '../../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../../statelessComponents/DriveExplorer/types';
import { formatAccessCount } from '../../../utils/formatters';

export interface AccessCountCellProps {
    count?: number;
    className?: string;
}

export function AccessCountCell({ count, className }: AccessCountCellProps) {
    return <span className={clsx('text-pre', className)}>{formatAccessCount(count)}</span>;
}

export const defaultAccessCountCellConfig: CellDefinitionConfig = {
    id: 'accessCount',
    headerText: c('Label').t`# Accesses`,
    className: 'w-1/6',
    sortField: SortField.numberOfInitializedDownloads,
    sortConfig: [{ field: SortField.numberOfInitializedDownloads, comparator: numberComparator }],
    testId: 'column-num-accesses',
};

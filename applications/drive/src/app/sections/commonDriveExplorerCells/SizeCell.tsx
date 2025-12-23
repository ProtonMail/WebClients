import { c } from 'ttag';

import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import { numberComparator } from '../../modules/sorting/comparators';
import { SortField } from '../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../statelessComponents/DriveExplorer/types';

export interface SizeCellProps {
    size: number;
    className?: string;
}

export function SizeCell({ size, className }: SizeCellProps) {
    return <span className={clsx('text-pre', className)}>{humanSize({ bytes: size })}</span>;
}

export const defaultSizeCellConfig: CellDefinitionConfig = {
    id: 'size',
    headerText: c('Label').t`Size`,
    className: 'w-1/10',
    sortField: SortField.size,
    sortConfig: [{ field: SortField.size, comparator: numberComparator }],
    testId: 'column-size',
};

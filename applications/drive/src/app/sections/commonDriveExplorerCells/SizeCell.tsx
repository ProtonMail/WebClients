import { c } from 'ttag';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import { nodeTypeComparator, numberComparator, stringComparator } from '../../modules/sorting/comparators';
import { SortField } from '../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../statelessComponents/DriveExplorer/types';

export interface SizeCellProps {
    size: number | undefined;
    className?: string;
}

export function SizeCell({ size, className }: SizeCellProps) {
    const isSizeFieldNotApplicable = size === undefined;
    const content = isSizeFieldNotApplicable ? <span className="text-pre">--</span> : humanSize({ bytes: size });
    return <span className={clsx('text-pre', className)}>{content}</span>;
}

export const defaultSizeCellConfig: CellDefinitionConfig = {
    id: 'size',
    headerText: c('Label').t`Size`,
    className: 'w-1/10',
    sortField: SortField.size,
    sortConfig: [
        { field: SortField.nodeType, comparator: nodeTypeComparator },
        { field: SortField.size, comparator: numberComparator },
        { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.ASC },
    ],
    testId: 'column-size',
};

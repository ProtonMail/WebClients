import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { SortField } from '../../../hooks/util/useSorting';
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
    sortField: SortField.numAccesses,
    testId: 'column-num-accesses',
};

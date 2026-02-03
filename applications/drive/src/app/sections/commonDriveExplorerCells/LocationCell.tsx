import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { SortField, stringComparator } from '../../modules/sorting';
import type { CellDefinitionConfig } from '../../statelessComponents/DriveExplorer/types';

export interface LocationCellProps {
    location: string;
    className?: string;
}

export function LocationCell({ location, className }: LocationCellProps) {
    return (
        <div title={location} className={clsx('text-ellipsis', className)}>
            <span className="text-pre">{location}</span>
        </div>
    );
}

export const defaultLocationCellConfig: CellDefinitionConfig = {
    id: 'location',
    headerText: c('Label').t`Location`,
    className: 'w-1/3',
    testId: 'column-location',
    sortField: SortField.location,
    sortConfig: [{ field: SortField.location, comparator: stringComparator }],
};

import { c } from 'ttag';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { CellDefinitionConfig } from '../../../statelessComponents/DriveExplorer/types';

export interface LocationCellProps {
    location: string;
    isTrashed?: boolean;
    className?: string;
}

export function LocationCell({ location, isTrashed = false, className }: LocationCellProps) {
    return (
        <div title={location} className={clsx('text-ellipsis', className)}>
            <span className="text-pre">
                {isTrashed && <Icon name="trash" className="mr-1" />}
                {location}
            </span>
        </div>
    );
}

export const defaultLocationCellConfig: CellDefinitionConfig = {
    id: 'location',
    headerText: c('Label').t`Location`,
    className: 'w-1/5',
    testId: 'column-location',
};

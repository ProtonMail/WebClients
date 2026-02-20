import { c } from 'ttag';

import { TimeIntl } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { dateComparator, stringComparator } from '../../modules/sorting/comparators';
import { SortField } from '../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../statelessComponents/DriveExplorer/types';
import { dateToLegacyTimestamp } from '../../utils/sdk/legacyTime';

export interface ModifiedCellProps {
    modifiedTime: Date;
    className?: string;
}

export function ModifiedCell({ modifiedTime, className }: ModifiedCellProps) {
    return (
        <span
            className={clsx('text-pre', className)}
            title={readableTime(dateToLegacyTimestamp(modifiedTime), {
                locale: dateLocale,
                format: 'PP',
            })}
        >
            <TimeIntl
                options={{
                    year: 'numeric',
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: 'numeric',
                }}
            >
                {dateToLegacyTimestamp(modifiedTime)}
            </TimeIntl>
        </span>
    );
}

export const defaultModifiedCellConfig: CellDefinitionConfig = {
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

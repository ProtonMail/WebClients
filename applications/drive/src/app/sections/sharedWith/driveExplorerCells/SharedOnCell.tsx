import { c } from 'ttag';

import { TimeIntl } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { dateComparator, stringComparator } from '../../../modules/sorting/comparators';
import { SortField } from '../../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../../statelessComponents/DriveExplorer/types';
import { dateToLegacyTimestamp } from '../../../utils/sdk/legacyTime';

export interface SharedOnCellProps {
    sharedOn: Date;
    className?: string;
}

export const SharedOnCell = ({ sharedOn, className }: SharedOnCellProps) => {
    return (
        <span
            className={clsx('text-pre', className)}
            title={readableTime(dateToLegacyTimestamp(sharedOn), {
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
                {dateToLegacyTimestamp(sharedOn)}
            </TimeIntl>
        </span>
    );
};

export const defaultSharedOnCellConfig: CellDefinitionConfig = {
    id: 'sharedOn',
    headerText: c('Label').t`Shared on`,
    className: 'w-1/6',
    sortField: SortField.sharedOn,
    sortConfig: [
        { field: SortField.sharedOn, comparator: dateComparator },
        { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.ASC },
    ],
    testId: 'column-shared-on',
};

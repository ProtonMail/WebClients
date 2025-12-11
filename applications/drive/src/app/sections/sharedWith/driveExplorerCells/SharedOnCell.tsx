import { c } from 'ttag';

import { TimeIntl } from '@proton/components';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { SortField } from '../../../hooks/util/useSorting';
import type { CellDefinition } from '../../../statelessComponents/DriveExplorer/types';
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

export const defaultSharedOnCellConfig: Omit<CellDefinition, 'render'> = {
    id: 'sharedOn',
    headerText: c('Label').t`Shared on`,
    className: 'w-1/6',
    sortField: SortField.sharedOn,
    testId: 'column-shared-on',
};

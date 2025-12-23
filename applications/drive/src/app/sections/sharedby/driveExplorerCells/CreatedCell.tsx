import { c } from 'ttag';

import { TimeIntl } from '@proton/components';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { SortField } from '../../../hooks/util/useSorting';
import type { CellDefinitionConfig } from '../../../statelessComponents/DriveExplorer/types';
import { dateToLegacyTimestamp } from '../../../utils/sdk/legacyTime';

export interface CreatedCellProps {
    time: Date;
    className?: string;
}

export function CreatedCell({ time, className }: CreatedCellProps) {
    return (
        <span
            className={clsx('text-pre', className)}
            title={readableTime(dateToLegacyTimestamp(time), {
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
                {dateToLegacyTimestamp(time)}
            </TimeIntl>
        </span>
    );
}

export const defaultCreatedCellConfig: CellDefinitionConfig = {
    id: 'created',
    headerText: c('Label').t`Created`,
    className: 'w-1/6',
    sortField: SortField.linkCreateTime,
    testId: 'column-share-created',
};

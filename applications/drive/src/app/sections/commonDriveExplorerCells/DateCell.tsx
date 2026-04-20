import { TimeIntl } from '@proton/components';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { dateToLegacyTimestamp } from '../../utils/sdk/legacyTime';

export interface DateCellProps {
    date: Date;
    className?: string;
}

// Generic date presenter shared across column-specific cells (Modified, Trashed, ...).
export function DateCell({ date, className }: DateCellProps) {
    return (
        <span
            className={clsx('text-pre', className)}
            title={readableTime(dateToLegacyTimestamp(date), {
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
                {dateToLegacyTimestamp(date)}
            </TimeIntl>
        </span>
    );
}

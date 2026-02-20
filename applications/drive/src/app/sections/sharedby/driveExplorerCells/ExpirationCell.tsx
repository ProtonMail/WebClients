import { c } from 'ttag';

import { TimeIntl } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { dateComparator, nodeTypeComparator, stringComparator } from '../../../modules/sorting/comparators';
import { SortField } from '../../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../../statelessComponents/DriveExplorer/types';
import { dateToLegacyTimestamp } from '../../../utils/sdk/legacyTime';

export interface ExpirationCellProps {
    time?: Date;
    isExpired?: boolean;
    showExpiredLabel?: boolean;
    className?: string;
}

export function ExpirationCell({ time, isExpired = false, showExpiredLabel = true, className }: ExpirationCellProps) {
    if (!time) {
        return <span className={clsx('text-pre', className)}>{c('Label').t`Never`}</span>;
    }

    return (
        <div className={clsx('flex flex-nowrap', className)}>
            <span
                className="text-pre"
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
            {isExpired && showExpiredLabel && <span className="ml-1">{c('Label').t`(Expired)`}</span>}
        </div>
    );
}

export const defaultExpirationCellConfig: CellDefinitionConfig = {
    id: 'expiration',
    headerText: c('Label').t`Expires`,
    className: 'w-1/5',
    sortField: SortField.expirationTime,
    sortConfig: [
        { field: SortField.expirationTime, comparator: dateComparator },
        { field: SortField.nodeType, comparator: nodeTypeComparator },
        { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.ASC },
    ],
    testId: 'column-share-expires',
};

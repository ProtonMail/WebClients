import type { FC } from 'react';

import { c, msgid } from 'ttag';

import { TableCell, TableRow } from '@proton/components/components/table';
import type { MonitorTableRow } from '@proton/pass/hooks/monitor/useBreachesTable';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { formatEpoch } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

import { BreachGroupRowActions } from './BreachGroupRowActions';

const getStatusClassname = ({ monitored, verified, breached }: MonitorTableRow) => {
    if (monitored && verified && !breached) return 'color-success';
    if (!verified && monitored) return 'color-weak';
};

const getStatusLabel = ({ type, monitored, verified, breached, breachedAt, breachCount }: MonitorTableRow) => {
    if (type === AddressType.CUSTOM) {
        if (!monitored) return c('Info').t`Suggested`;
        if (!verified) return c('Info').t`Unverified`;
    }

    if (!breached) return c('Info').t`No breaches detected`;

    if (breachedAt) {
        const formattedDate = formatEpoch('MMM d, yyyy')(breachedAt);
        return c('Info').t`Latest breach on ${formattedDate}`;
    }

    if (breachCount) return c('Info').t`${breachCount} breaches detected`;

    return c('Info').t`Breaches detected`;
};

export const BreachGroupRow: FC<MonitorTableRow> = (row) => {
    const { breached, email, monitored, verified, usageCount } = row;
    const statusClassName = getStatusClassname(row);
    const status = getStatusLabel(row);

    return (
        <TableRow className={clsx(monitored && verified && breached && 'color-danger')}>
            <TableCell className="text-ellipsis">{email}</TableCell>
            <TableCell className={clsx('text-ellipsis', statusClassName)}>{status}</TableCell>
            <TableCell className="text-ellipsis">
                {c('Label').ngettext(msgid`${usageCount} login`, `${usageCount} logins`, usageCount)}
            </TableCell>
            <TableCell>
                <div className="m-0 flex justify-end">
                    <BreachGroupRowActions {...row} />
                </div>
            </TableCell>
        </TableRow>
    );
};

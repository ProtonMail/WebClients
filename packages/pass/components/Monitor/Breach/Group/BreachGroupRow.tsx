import type { FC } from 'react';
import { Link } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { TableCell, TableRow } from '@proton/components/components/table';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import type { MonitorTableRow } from '@proton/pass/hooks/monitor/useBreachesTable';
import { getAddressId } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { formatEpoch } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

import { BreachGroupRowActions } from './BreachGroupRowActions';

const getStatusClassname = (row: MonitorTableRow) => {
    const verified = row.type !== AddressType.CUSTOM || row.verified;
    if (verified && row.monitored && !row.breached) return 'color-success';
    if (!verified && row.monitored) return 'color-weak';
};

const getStatusLabel = (row: MonitorTableRow) => {
    if (row.type === AddressType.CUSTOM) {
        if (row.suggestion) return c('Info').t`Suggested`;
        if (!row.verified) return c('Info').t`Unverified`;
    }

    if (!row.breached) return c('Info').t`No breaches detected`;

    if (row.breachedAt) {
        const formattedDate = formatEpoch('MMM d, yyyy')(row.breachedAt);
        return c('Info').t`Latest breach on ${formattedDate}`;
    }

    if (row.breachCount) return c('Info').t`${row.breachCount} breaches detected`;

    return c('Info').t`Breaches detected`;
};

export const BreachGroupRow: FC<MonitorTableRow> = (row) => {
    const { breached, email, monitored, type, usageCount } = row;
    const statusClassName = getStatusClassname(row);
    const status = getStatusLabel(row);
    const clickable = (type !== AddressType.CUSTOM || row.verified) && monitored;

    return (
        <TableRow className={clsx(monitored && breached && 'color-danger')}>
            <TableCell className="text-ellipsis">
                {clickable ? (
                    <Link
                        to={getLocalPath(`monitor/dark-web/${row.type}/${getAddressId(row)}`)}
                        className="block overflow-hidden"
                    >
                        <button className="max-w-full color-norm text-ellipsis">{email}</button>
                    </Link>
                ) : (
                    email
                )}
            </TableCell>
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

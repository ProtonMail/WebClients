import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { TableCell, TableRow } from '@proton/components/components/table';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import type { MonitorTableRow } from '@proton/pass/hooks/monitor/useBreachesTable';
import { getAddressId } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { selectMonitorSettingByType } from '@proton/pass/store/selectors';
import { formatEpoch } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

import { BreachGroupRowActions } from './BreachGroupRowActions';

const getStatusClassname = (row: MonitorTableRow) => {
    const verified = row.type !== AddressType.CUSTOM || row.verified;
    if (verified && row.monitored && !row.breached) return 'color-success';
    if (verified !== row.monitored) return 'color-weak';
};

const getStatusLabel = (row: MonitorTableRow) => {
    if (row.type === AddressType.CUSTOM) {
        if (row.suggestion) return c('Info').t`Suggested`;
        if (!row.verified) return c('Info').t`Unverified`;
    }

    if (!row.monitored) return c('Info').t`Paused`;
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
    const paused = !useSelector(selectMonitorSettingByType(row.type));

    const statusClassName = paused ? 'color-weak' : getStatusClassname(row);
    const status = paused ? c('Info').t`Paused` : getStatusLabel(row);
    const clickable = !paused && (type !== AddressType.CUSTOM || row.verified) && monitored;
    const danger = monitored && breached;

    return (
        <TableRow className={clsx(danger && 'color-danger')}>
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

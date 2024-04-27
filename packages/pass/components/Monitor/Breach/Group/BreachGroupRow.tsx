import type { FC } from 'react';

import { c, msgid } from 'ttag';

import { TableCell, TableRow } from '@proton/components/components/table';
import type { MonitorTableRow } from '@proton/pass/hooks/monitor/useBreachesTable';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { formatEpoch } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

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

const getUsedInLabel = ({ usedIn }: MonitorTableRow) => {
    const { aliases, logins } = usedIn;
    const loginLabel = c('Label').ngettext(msgid`${logins} login`, `${logins} logins`, logins);
    const aliasLabel = aliases && c('Label').ngettext(msgid`${aliases} alias`, `${aliases} aliases`, aliases);
    return [loginLabel, aliasLabel].filter(isTruthy).join(', ');
};

export const BreachGroupRow: FC<MonitorTableRow> = (row) => {
    const { breached, email, monitored, verified } = row;
    const statusClassName = getStatusClassname(row);
    const status = getStatusLabel(row);
    const usages = getUsedInLabel(row);

    return (
        <TableRow className={clsx(monitored && verified && breached && 'color-danger')}>
            <TableCell>{email}</TableCell>
            <TableCell className={statusClassName}>{status}</TableCell>
            <TableCell>{usages}</TableCell>
            <TableCell>
                <div className="m-0 flex justify-end">
                    <BreachGroupRowActions {...row} />
                </div>
            </TableCell>
        </TableRow>
    );
};

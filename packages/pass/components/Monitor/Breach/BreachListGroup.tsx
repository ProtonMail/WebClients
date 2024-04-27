import type { FC } from 'react';
import { Link } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Icon } from '@proton/components/components/icon';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
} from '@proton/components/components/table';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import type { MonitorTableItem } from '@proton/pass/hooks/monitor/useBreachesTable';
import { getAddressId } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { formatEpoch } from '@proton/pass/utils/time/format';
import isTruthy from '@proton/utils/isTruthy';

const BreachListRow: FC<{ address: MonitorTableItem }> = ({ address }) => {
    const { breached, breachedAt, breachCount, email, monitored, type, usedIn, verified } = address;

    const className = monitored && verified && breached ? 'color-danger' : '';

    const statusClassName = (() => {
        if (monitored && verified && !breached) return 'color-success';
        if (!monitored && !verified) return 'color-weak';
    })();

    const status = (() => {
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
    })();

    const usages = (() => {
        const { aliases, logins } = usedIn;
        const loginLabel = c('Label').ngettext(msgid`${logins} login`, `${logins} logins`, logins);
        const aliasLabel = aliases && c('Label').ngettext(msgid`${aliases} alias`, `${aliases} aliases`, aliases);
        return [loginLabel, aliasLabel].filter(isTruthy).join(', ');
    })();

    const action = (() => {
        if (address.type === AddressType.CUSTOM) {
            if (!monitored) {
                return (
                    <Button pill shape="solid" color="weak" size="small">
                        {c('Action').t`Add`}
                    </Button>
                );
            }

            if (!verified) {
                return (
                    <Button pill size="small" shape="ghost">
                        <Icon name="three-dots-vertical" />
                    </Button>
                );
            }
        }

        return (
            <Link to={getLocalPath(`monitor/dark-web/${address.type}/${getAddressId(address)}`)}>
                <Button pill size="small" shape="ghost" type="button">
                    <Icon name="chevron-right" />
                </Button>
            </Link>
        );
    })();

    return (
        <TableRow className={className}>
            <TableCell>{email}</TableCell>
            <TableCell className={statusClassName}>{status}</TableCell>
            <TableCell>{usages}</TableCell>
            <TableCell>
                <div className="m-0 flex justify-end">{action}</div>
            </TableCell>
        </TableRow>
    );
};

export const BreachListGroup: FC<{
    className?: string;
    groupName?: string;
    seeAllHref?: string;
    displayLimit?: number;
    data: MonitorTableItem[];
}> = ({ className, groupName, seeAllHref, displayLimit, data }) => {
    return (
        <section className={className}>
            {groupName && (
                <header className="mb-2 flex justify-space-between">
                    <span className="text-bold">{groupName}</span>
                    {displayLimit && data.length > displayLimit && seeAllHref && <Link to={seeAllHref}>See all</Link>}
                </header>
            )}
            <Card rounded>
                <Table hasActions responsive="stacked">
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>{c('Label').t`Email`}</TableHeaderCell>
                            <TableHeaderCell>{c('Label').t`Status`}</TableHeaderCell>
                            <TableHeaderCell>{c('Label').t`Used in`}</TableHeaderCell>
                            <TableHeaderCell className="w-custom" style={{ '--w-custom': '4rem' }} />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.slice(0, displayLimit).map((address) => (
                            <BreachListRow key={address.email} address={address} />
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </section>
    );
};

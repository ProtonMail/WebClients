import type { FC, ReactNode } from 'react';
import { useSelector } from 'react-redux';
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
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import type { MonitorTableItem } from '@proton/pass/hooks/monitor/useBreachesTable';
import { getAddressId } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { addCustomAddressRequest, deleteCustomAddressRequest } from '@proton/pass/store/actions/requests';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import { formatEpoch } from '@proton/pass/utils/time/format';
import isTruthy from '@proton/utils/isTruthy';

const BreachListRow: FC<{ address: MonitorTableItem }> = ({ address }) => {
    const monitor = useMonitor();
    const adding = useSelector(selectRequestInFlight(addCustomAddressRequest(address.email)));
    const deleting = useSelector(selectRequestInFlight(deleteCustomAddressRequest(address.email)));
    const loading = adding || deleting;

    const { breached, breachedAt, breachCount, email, monitored, type, usedIn, verified } = address;

    const className = monitored && verified && breached ? 'color-danger' : '';

    const statusClassName = (() => {
        if (monitored && verified && !breached) return 'color-success';
        if (!verified && monitored) return 'color-weak';
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
                    <Button
                        className="shrink-0"
                        pill
                        shape="solid"
                        color="weak"
                        size="small"
                        onClick={() => monitor.addAddress(address.email)}
                        loading={adding}
                    >
                        {c('Action').t`Add`}
                    </Button>
                );
            }

            if (!verified) {
                return (
                    <QuickActionsDropdown
                        icon="three-dots-vertical"
                        size="small"
                        shape="ghost"
                        className="shrink-0"
                        originalPlacement="bottom-start"
                        disabled={loading}
                    >
                        <DropdownMenuButton
                            onClick={() => monitor.verifyAddress(address)}
                            label={c('Label').t`Verify`}
                            icon="envelope-open"
                        />
                        <DropdownMenuButton
                            onClick={() => monitor.deleteAddress(address.addressId)}
                            label={c('Label').t`Remove`}
                            icon="trash"
                            loading={deleting}
                        />
                    </QuickActionsDropdown>
                );
            }
        }

        return (
            <Link className="shrink-0" to={getLocalPath(`monitor/dark-web/${address.type}/${getAddressId(address)}`)}>
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

type Props = {
    actions?: ReactNode;
    className?: string;
    data: MonitorTableItem[];
    displayLimit?: number;
    groupName?: string;
    loading: boolean;
    seeAllHref?: string;
};

export const BreachListGroup: FC<Props> = ({
    actions,
    className,
    data,
    displayLimit,
    groupName,
    loading,
    seeAllHref,
}) => (
    <section className={className}>
        {groupName && (
            <header className="mb-2 flex justify-space-between">
                <div className="flex gap-2 items-center">
                    <span className="text-bold">{groupName}</span>
                    {actions}
                </div>
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
                    {loading ? (
                        <TableRowLoading rows={3} cells={4} />
                    ) : (
                        data
                            .slice(0, displayLimit)
                            .map((address) => <BreachListRow key={address.email} address={address} />)
                    )}
                </TableBody>
            </Table>
        </Card>
    </section>
);

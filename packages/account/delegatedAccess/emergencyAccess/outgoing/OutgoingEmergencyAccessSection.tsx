import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Banner, Button } from '@proton/atoms';
import Badge from '@proton/components/components/badge/Badge';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Info from '@proton/components/components/link/Info';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { SECOND } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { DelegatedAccessStateEnum } from '../../interface';
import { ContactCell } from '../ContactCell';
import {
    getFormattedAccessibleAtDate,
    getFormattedCreateTime,
    getFormattedRemainingDays,
    getFormattedTriggerDelay,
} from '../date';
import { type OutgoingController, useOutgoingController } from './OutgoingController';
import { getMetaOutgoingDelegatedAccess } from './helper';
import type { MetaIncomingDelegatedAccess } from './interface';

type ItemValue = OutgoingController['items'][0];

interface OutgoingItemProps {
    labels: string[];
    value: ItemValue;
    notify: OutgoingController['notify'];
    meta: MetaIncomingDelegatedAccess;
}

const OutgoingDelegatedAccessCell = ({
    value: {
        outgoingDelegatedAccess,
        parsedOutgoingDelegatedAccess: { accessibleAtDate },
    },
    meta: { hasRequestedAccess, accessibleAtTimeDiff, canRejectAccess },
}: Pick<OutgoingItemProps, 'value' | 'meta'>) => {
    if (outgoingDelegatedAccess.State === DelegatedAccessStateEnum.Disabled) {
        return <Badge type="origin">{c('emergency_access').t`Disabled`}</Badge>;
    }

    if (hasRequestedAccess) {
        const formattedAccessibleAt = getFormattedAccessibleAtDate(accessibleAtDate);
        const tooltip = formattedAccessibleAt
            ? c('emergency_access').t`Access will be granted on ${formattedAccessibleAt}`
            : undefined;
        return (
            <>
                <Badge type="warning" tooltip={tooltip}>{c('emergency_access').t`Requesting access`}</Badge>
                {tooltip && <span title={tooltip}>{getFormattedRemainingDays(accessibleAtTimeDiff)}</span>}
            </>
        );
    }

    if (canRejectAccess) {
        const formattedAccessibleAt = getFormattedAccessibleAtDate(accessibleAtDate);
        const aside = formattedAccessibleAt ? c('emergency_access').t`on ${formattedAccessibleAt}` : undefined;
        return (
            <>
                <Badge type="info">{c('emergency_access').t`Access granted`}</Badge>
                {aside && <span>{aside}</span>}
            </>
        );
    }
};

const OutgoingItem = ({
    notify,
    labels,
    value,
    value: {
        parsedOutgoingDelegatedAccess: { contact, createdAtDate, accessibleTriggerDelayMs },
    },
    meta,
    meta: { canGrantAccess, canDelete, canChangeWaitTime },
}: OutgoingItemProps) => {
    return (
        <TableRow labels={labels}>
            <TableCell>
                <ContactCell {...contact} />
            </TableCell>
            <TableCell>
                <time>{getFormattedCreateTime(createdAtDate)}</time>
            </TableCell>
            <TableCell>
                <div>{getFormattedTriggerDelay(accessibleTriggerDelayMs)}</div>
            </TableCell>
            <TableCell>
                <OutgoingDelegatedAccessCell value={value} meta={meta} />
            </TableCell>
            <TableCell>
                <DropdownActions
                    list={[
                        canDelete && {
                            text: c('Action').t`Remove`,
                            onClick: () => notify({ type: 'delete', value }),
                        },
                        canGrantAccess && {
                            text: c('emergency_access').t`Give access now`,
                            onClick: () => notify({ type: 'grant-access', value }),
                        },
                        canChangeWaitTime && {
                            text: c('emergency_access').t`Change wait time`,
                            onClick: () => notify({ type: 'change-wait-time', value }),
                        },
                    ].filter(isTruthy)}
                    size="small"
                />
            </TableCell>
        </TableRow>
    );
};

const OutgoingTable = ({
    notify,
    items,
    loading,
}: {
    loading: boolean;
    notify: OutgoingController['notify'];
    items: OutgoingController['items'];
}) => {
    const [, rerender] = useState<any>();

    useEffect(() => {
        // Rerender every 30 seconds so that we compute the remaining days based on `now` correctly
        const handle = setInterval(() => rerender({}), 30 * SECOND);
        return () => {
            clearInterval(handle);
        };
    }, []);

    const now = Date.now();

    const headerCells = [
        { title: c('Title').t`Name`, className: 'w-1/4' },
        { title: c('Title').t`Added on` },
        {
            title: c('emergency_access').t`Wait time`,
            info: c('emergency_access').t`Time required before automatically granting them access`,
        },
        { title: c('Title').t`Status`, className: 'w-1/4' },
        { title: '' },
    ];

    const labels = headerCells.map((column) => column.title);

    return (
        <Table hasActions responsive="cards">
            <TableHeader>
                <TableRow>
                    {headerCells.map(({ title, info, className }) => (
                        <TableCell key={title} type="header" className={className}>
                            <div className="flex items-center flex-nowrap">
                                {title}
                                {info && <Info className="ml-2 shrink-0" title={info} />}
                            </div>
                        </TableCell>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody loading={loading} colSpan={5}>
                {items.map((value) => {
                    const meta = getMetaOutgoingDelegatedAccess({ now, value });
                    return (
                        <OutgoingItem
                            key={value.outgoingDelegatedAccess.DelegatedAccessID}
                            labels={labels}
                            value={value}
                            meta={meta}
                            notify={notify}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export const OutgoingEmergencyAccessSection = () => {
    const controller = useOutgoingController();

    return (
        <>
            <div className="text-semibold text-xl mb-3">{c('emergency_access').t`People I trust`}</div>
            <SettingsParagraph>
                {c('emergency_access').t`They may ask to access my account in case of an emergency.`}
            </SettingsParagraph>
            <div className="mb-4">
                {controller.meta.hasReachedLimit ? (
                    <Banner>
                        {c('emergency_access').ngettext(
                            msgid`You reached the maximum of ${controller.meta.count} trusted contact.`,
                            `You reached the maximum of ${controller.meta.count} trusted contacts.`,
                            controller.meta.count
                        )}
                    </Banner>
                ) : (
                    <Button
                        color="norm"
                        onClick={() => {
                            controller.notify({ type: 'add' });
                        }}
                    >{c('emergency_access').t`Add emergency contact`}</Button>
                )}
            </div>
            {(controller.items.length > 0 || controller.loading) && (
                <OutgoingTable items={controller.items} loading={controller.loading} notify={controller.notify} />
            )}
        </>
    );
};

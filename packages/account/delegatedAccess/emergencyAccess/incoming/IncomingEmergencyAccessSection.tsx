import { useEffect, useState } from 'react';

import { c } from 'ttag';

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
import { type IncomingController, useIncomingController } from './IncomingController';
import { getMetaIncomingDelegatedAccess } from './helper';
import type { MetaIncomingDelegatedAccess } from './interface';

type ItemValue = IncomingController['items'][0];

interface IncomingItemProps {
    value: ItemValue;
    notify: IncomingController['notify'];
    labels: string[];
    meta: MetaIncomingDelegatedAccess;
}

const IncomingDelegatedAccessCell = ({
    value: {
        incomingDelegatedAccess,
        parsedIncomingDelegatedAccess: { accessibleAtDate },
    },
    meta: { canLogin, hasRequestedAccess, accessibleAtTimeDiff },
}: Pick<IncomingItemProps, 'value' | 'meta'>) => {
    if (incomingDelegatedAccess.State === DelegatedAccessStateEnum.Disabled) {
        return <Badge type="origin">{c('emergency_access').t`Disabled`}</Badge>;
    }

    if (canLogin) {
        const formattedAccessibleAt = getFormattedAccessibleAtDate(accessibleAtDate);
        const tooltip = formattedAccessibleAt
            ? c('emergency_access').t`Access granted on ${formattedAccessibleAt}`
            : undefined;
        return <Badge type="success" tooltip={tooltip}>{c('emergency_access').t`Access granted`}</Badge>;
    }

    if (hasRequestedAccess) {
        const formattedAccessibleAt = getFormattedAccessibleAtDate(accessibleAtDate);
        const tooltip = c('emergency_access').t`Access will be granted on ${formattedAccessibleAt}`;
        return (
            <>
                <Badge type="info" tooltip={tooltip}>{c('emergency_access').t`Access requested`}</Badge>
                <span title={tooltip}>{getFormattedRemainingDays(accessibleAtTimeDiff)}</span>
            </>
        );
    }
};

const IncomingDelegatedAccessActions = ({
    value,
    meta: { canRequestAccess, canLogin, canDelete },
    notify,
}: Pick<IncomingItemProps, 'value' | 'meta' | 'notify'>) => {
    return (
        <DropdownActions
            list={[
                canRequestAccess && {
                    text: c('Action').t`Request access`,
                    onClick: () => notify({ type: 'request-access', value }),
                },
                canLogin && {
                    loading: value.loading.access,
                    text: c('Action').t`Access account`,
                    onClick: () => notify({ type: 'access', value }),
                },
                canDelete && {
                    actionType: 'delete' as const,
                    text: c('Action').t`Stop being trusted contact`,
                    onClick: () => notify({ type: 'delete', value }),
                },
            ].filter(isTruthy)}
            size="small"
        />
    );
};

const IncomingItem = ({
    value,
    value: {
        parsedIncomingDelegatedAccess: { contact, createdAtDate, accessibleTriggerDelayMs },
    },
    meta,
    labels,
    notify,
}: IncomingItemProps) => {
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
                <IncomingDelegatedAccessCell value={value} meta={meta} />
            </TableCell>
            <TableCell>
                <IncomingDelegatedAccessActions value={value} meta={meta} notify={notify} />
            </TableCell>
        </TableRow>
    );
};

const IncomingTable = ({
    loading,
    items,
    notify,
}: {
    loading: boolean;
    items: IncomingController['items'];
    notify: IncomingController['notify'];
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

    const headerLabels = headerCells.map((cell) => cell.title);

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
                    const meta = getMetaIncomingDelegatedAccess({ now, value });
                    return (
                        <IncomingItem
                            key={value.incomingDelegatedAccess.DelegatedAccessID}
                            labels={headerLabels}
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

export const IncomingEmergencyAccessSection = () => {
    const controller = useIncomingController();
    return (
        <>
            <div className="text-semibold text-xl mb-3">{c('emergency_access').t`People who trust me`}</div>
            {!controller.items.length && !controller.loading ? (
                <SettingsParagraph>
                    {c('emergency_access').t`You have not been designated as an emergency contact for anyone yet.`}
                </SettingsParagraph>
            ) : (
                <>
                    <SettingsParagraph>
                        {c('emergency_access')
                            .t`They added me as trusted contact. I can access their account in case of an emergency.`}
                    </SettingsParagraph>
                    <IncomingTable items={controller.items} loading={controller.loading} notify={controller.notify} />
                </>
            )}
        </>
    );
};

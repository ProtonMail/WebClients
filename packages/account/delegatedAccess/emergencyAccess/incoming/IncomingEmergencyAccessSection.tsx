import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Pill, Tooltip } from '@proton/atoms';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Info from '@proton/components/components/link/Info';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { IcHourglass } from '@proton/icons';
import { SECOND } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { ContactCell } from '../ContactCell';
import { getFormattedAccessibleAtDate, getFormattedRemainingDays, getFormattedTriggerDelay } from '../date';
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
        parsedIncomingDelegatedAccess: { accessibleAtDate, isDisabled },
    },
    meta: { canLogin, hasRequestedAccess, accessibleAtTimeDiff },
}: Pick<IncomingItemProps, 'value' | 'meta'>) => {
    if (isDisabled) {
        return (
            <Pill color="#5C5958" backgroundColor="#E5E4E1" rounded="rounded-sm" className="text-semibold">{c(
                'emergency_access'
            ).t`Disabled`}</Pill>
        );
    }

    if (canLogin) {
        const formattedAccessibleAt = getFormattedAccessibleAtDate(accessibleAtDate);
        const tooltip = formattedAccessibleAt
            ? c('emergency_access').t`Access granted on ${formattedAccessibleAt}`
            : undefined;
        return (
            <Tooltip title={tooltip}>
                <Pill
                    color="#164616"
                    backgroundColor="#C9E9C9"
                    rounded="rounded-sm"
                    className="text-semibold text-center"
                >{c('emergency_access').t`Access granted`}</Pill>
            </Tooltip>
        );
    }

    if (hasRequestedAccess) {
        const formattedAccessibleAt = getFormattedAccessibleAtDate(accessibleAtDate);
        const tooltip = c('emergency_access').t`Access will be granted on ${formattedAccessibleAt}`;
        return (
            <div className="flex items-center justify-start gap-1">
                <Tooltip title={tooltip}>
                    <Pill
                        color="#093E53"
                        backgroundColor="#C0E4F2"
                        rounded="rounded-sm"
                        className="text-semibold mr-1 text-center"
                    >{c('emergency_access').t`Access requested`}</Pill>
                </Tooltip>
                <span title={tooltip} className="inline-flex items-center">
                    <IcHourglass className="color-weak shrink-0 mr-1" />
                    {getFormattedRemainingDays(accessibleAtTimeDiff)}
                </span>
            </div>
        );
    }
};

const IncomingDelegatedAccessActions = ({
    value,
    meta: { canRequestAccess, canCancelRequestAccess, canLogin, canDelete },
    notify,
}: Pick<IncomingItemProps, 'value' | 'meta' | 'notify'>) => {
    return (
        <div className="inline-flex">
            <DropdownActions
                list={[
                    canRequestAccess && {
                        text: c('Action').t`Request access`,
                        onClick: () => notify({ type: 'request-access', value }),
                    },
                    canCancelRequestAccess && {
                        text: c('Action').t`Cancel request`,
                        onClick: () => notify({ type: 'cancel-request-access', value }),
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
        </div>
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
                <ContactCell {...contact} createdAtDate={createdAtDate} />
            </TableCell>
            <TableCell label={c('emergency_access').t`Wait time for access`}>
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
        { title: c('Title').t`Name`, className: 'w-1/3' },
        {
            title: c('emergency_access').t`Wait time`,
            info: c('emergency_access').t`Time required before automatically granting them access`,
        },
        { title: c('Title').t`Status`, className: 'w-1/3' },
        { title: '' },
    ];

    const headerLabels = headerCells.map((cell) => cell.title);

    return (
        <Table hasActions responsive="cards" data-testid="incoming-emergency-access-table">
            <TableHeader>
                <TableRow>
                    {headerCells.map(({ title, info, className }) => (
                        <TableHeaderCell key={title} className={className}>
                            <div className="flex items-center flex-nowrap">
                                {title}
                                {info && <Info className="ml-2 shrink-0" title={info} />}
                            </div>
                        </TableHeaderCell>
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

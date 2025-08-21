import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Banner, Button, Pill, Tooltip } from '@proton/atoms';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Info from '@proton/components/components/link/Info';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { IcCalendarGrid, IcHourglass } from '@proton/icons';
import { SECOND } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { ContactCell } from '../ContactCell';
import { getFormattedAccessibleAtDate, getFormattedRemainingDays, getFormattedTriggerDelay } from '../date';
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
        parsedOutgoingDelegatedAccess: { accessibleAtDate, isDisabled },
    },
    meta: { hasRequestedAccess, accessibleAtTimeDiff, canRejectAccess },
}: Pick<OutgoingItemProps, 'value' | 'meta'>) => {
    if (isDisabled) {
        return (
            <Pill color="#5C5958" backgroundColor="#E5E4E1" rounded="rounded-sm" className="text-semibold">{c(
                'emergency_access'
            ).t`Disabled`}</Pill>
        );
    }

    if (hasRequestedAccess) {
        const formattedAccessibleAt = getFormattedAccessibleAtDate(accessibleAtDate);
        const tooltip = formattedAccessibleAt
            ? c('emergency_access').t`Access will be granted on ${formattedAccessibleAt}`
            : undefined;
        return (
            <div className="flex items-center justify-start gap-1">
                <Tooltip title={tooltip}>
                    <Pill
                        color="#5C3700"
                        backgroundColor="#F5D4A2"
                        rounded="rounded-sm"
                        className="text-semibold mr-1 text-center"
                    >{c('emergency_access').t`Requesting access`}</Pill>
                </Tooltip>
                {tooltip && (
                    <span title={tooltip} className="inline-flex items-center">
                        <IcHourglass className="color-weak shrink-0 mr-1" />
                        {getFormattedRemainingDays(accessibleAtTimeDiff)}
                    </span>
                )}
            </div>
        );
    }

    if (canRejectAccess) {
        const formattedAccessibleAt = getFormattedAccessibleAtDate(accessibleAtDate);
        const aside = formattedAccessibleAt ? (
            <span className="inline-flex items-center">
                <IcCalendarGrid className="color-weak shrink-0 mr-1" />
                {formattedAccessibleAt}
            </span>
        ) : undefined;
        return (
            <div className="flex items-center justify-start gap-1">
                <Pill
                    color="#164616"
                    backgroundColor="#C9E9C9"
                    rounded="rounded-sm"
                    className="text-semibold mr-1 text-center"
                >{c('emergency_access').t`Access granted`}</Pill>
                {aside}
            </div>
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
                <ContactCell {...contact} createdAtDate={createdAtDate} />
            </TableCell>
            <TableCell label={c('emergency_access').t`Wait time for access`}>
                <div>{getFormattedTriggerDelay(accessibleTriggerDelayMs)}</div>
            </TableCell>
            <TableCell>
                <OutgoingDelegatedAccessCell value={value} meta={meta} />
            </TableCell>
            <TableCell>
                <div className="inline-flex">
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
                </div>
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
        { title: c('Title').t`Name`, className: 'w-1/3' },
        {
            title: c('emergency_access').t`Wait time`,
            info: c('emergency_access').t`Time required before automatically granting them access`,
        },
        { title: c('Title').t`Status`, className: 'w-1/3' },
        { title: '' },
    ];

    const labels = headerCells.map((column) => column.title);

    return (
        <Table hasActions responsive="cards">
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
                {(() => {
                    if (controller.meta.hasReachedLimit) {
                        return (
                            <Banner>
                                {c('emergency_access').ngettext(
                                    msgid`You reached the maximum of ${controller.meta.count} trusted contact.`,
                                    `You reached the maximum of ${controller.meta.count} trusted contacts.`,
                                    controller.meta.count
                                )}
                            </Banner>
                        );
                    }

                    if (controller.meta.hasUpsell) {
                        return (
                            <PromotionButton
                                iconName="upgrade"
                                onClick={() => {
                                    controller.notify({ type: 'upsell' });
                                }}
                            >{c('emergency_access').t`Add emergency contact`}</PromotionButton>
                        );
                    }

                    if (controller.meta.hasAccess) {
                        return (
                            <Button
                                color="norm"
                                onClick={() => {
                                    controller.notify({ type: 'add' });
                                }}
                            >{c('emergency_access').t`Add emergency contact`}</Button>
                        );
                    }
                })()}
            </div>
            {(controller.items.length > 0 || controller.loading) && (
                <OutgoingTable items={controller.items} loading={controller.loading} notify={controller.notify} />
            )}
        </>
    );
};

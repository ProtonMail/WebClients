import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { useAddresses } from '@proton/components/hooks';
import { getCalendarStatusBadges } from '@proton/shared/lib/calendar/badges';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import {
    Button,
    ButtonLike,
    Icon,
    Info,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    Tooltip,
} from '../../../components';
import CalendarSelectIcon from '../../../components/calendarSelect/CalendarSelectIcon';
import CalendarBadge from './CalendarBadge';

interface Props {
    calendars: (VisualCalendar | SubscribedCalendar)[];
    defaultCalendarID?: string;
    user: UserModel;
    onSetDefault?: (id: string) => Promise<void>;
}

const CalendarsTable = ({ calendars = [], defaultCalendarID, user, onSetDefault }: Props) => {
    const { hasNonDelinquentScope } = user;
    const [addresses, loadingAddresses] = useAddresses();
    const [isLoading, setIsLoading] = useState<string>();

    const hasSingleAddress = !loadingAddresses && addresses.length === 1;

    if (!calendars.length) {
        return null;
    }

    return (
        <Table className="simple-table--has-actions">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="text-left w50">{c('Header').t`Name`}</TableHeaderCell>
                    <TableHeaderCell className="w20">
                        <div className="flex flex-align-items-center">
                            <span className="mr0-5">{c('Header').t`Status`}</span>
                            <Info url={getKnowledgeBaseUrl('/calendar-status')} />
                        </div>
                    </TableHeaderCell>
                    <TableHeaderCell>{c('Header').t`Actions`}</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {(calendars || []).map((calendar, index) => {
                    const { ID, Name, Color, Email } = calendar;

                    const { isDisabled, isDefault, isSubscribed, badges } = getCalendarStatusBadges(
                        calendar,
                        defaultCalendarID
                    );

                    return (
                        <TableRow key={ID}>
                            <TableCell>
                                <div key="id">
                                    <div className="grid-align-icon-center">
                                        <CalendarSelectIcon
                                            color={Color}
                                            className="mr0-75 flex-item-noshrink keep-left"
                                        />
                                        <div className="text-ellipsis" title={Name}>
                                            {Name}
                                        </div>
                                        {!hasSingleAddress && (
                                            <div
                                                className={clsx(['text-ellipsis text-sm m0 color-weak'])}
                                                style={{ '--index': index }}
                                                title={Email}
                                            >
                                                {Email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div data-test-id="calendar-settings-page:calendar-status" key="status">
                                    {badges.map(({ statusType, badgeType, text, tooltipText }) => (
                                        <CalendarBadge
                                            key={statusType}
                                            badgeType={badgeType}
                                            text={text}
                                            tooltipText={tooltipText}
                                        />
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-align-items-center flex-nowrap flex-justify-end">
                                    {!isSubscribed &&
                                        !isDisabled &&
                                        !isDefault &&
                                        hasNonDelinquentScope &&
                                        onSetDefault && (
                                            <Button
                                                disabled={!!isLoading}
                                                loading={isLoading === ID}
                                                onClick={async () => {
                                                    setIsLoading(ID);
                                                    await onSetDefault(ID);
                                                    setIsLoading(undefined);
                                                }}
                                                size="small"
                                                shape="outline"
                                                className="mr0-5"
                                            >{c('Action').t`Make default`}</Button>
                                        )}
                                    <Tooltip title={c('Calendar table settings button tooltip').t`Open settings`}>
                                        <ButtonLike
                                            as={Link}
                                            to={`/calendar/calendars/${ID}`}
                                            shape="outline"
                                            size="small"
                                            icon
                                            disabled={!!isLoading}
                                            className="flex-item-noshrink"
                                        >
                                            <Icon
                                                name="cog-wheel"
                                                alt={c('Calendar table settings button tooltip').t`Open settings`}
                                            />
                                        </ButtonLike>
                                    </Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default CalendarsTable;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { getCalendarStatusBadges } from '@proton/shared/lib/calendar/badges';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { useAddresses } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { Button, ButtonLike, Icon, Info, Table, TableBody, TableHeader, TableRow } from '../../../components';
import CalendarSelectIcon from '../../../components/calendarSelect/CalendarSelectIcon';
import useGetCalendarsEmails from '../hooks/useGetCalendarsEmails';
import CalendarBadge from './CalendarBadge';

import './CalendarsTable.scss';

interface Props {
    calendars: (VisualCalendar | SubscribedCalendar)[];
    defaultCalendarID?: string;
    user: UserModel;
    onSetDefault?: (id: string) => Promise<void>;
}

const CalendarsTable = ({ calendars = [], defaultCalendarID, user, onSetDefault }: Props) => {
    const { hasNonDelinquentScope } = user;
    const calendarAddressMap = useGetCalendarsEmails(calendars);
    const [addresses, loadingAddresses] = useAddresses();
    const [isLoading, setIsLoading] = useState<string>();

    const hasSingleAddress = !loadingAddresses && addresses.length === 1;

    if (!calendars.length) {
        return null;
    }

    return (
        <Table className="simple-table--has-actions">
            <TableHeader
                cells={[
                    c('Header').t`Name`,
                    <div className="flex flex-align-items-center">
                        <span className="mr0-5">{c('Header').t`Status`}</span>
                        <Info url={getKnowledgeBaseUrl('/calendar-status')} />
                    </div>,
                    c('Header').t`Actions`,
                ]}
            />
            <TableBody>
                {(calendars || []).map((calendar, index) => {
                    const { ID, Name, Color } = calendar;

                    const { isDisabled, isDefault, isSubscribed, badges } = getCalendarStatusBadges(
                        calendar,
                        defaultCalendarID
                    );

                    const calendarAddress = calendarAddressMap[ID] || '';

                    return (
                        <TableRow
                            key={ID}
                            cells={[
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
                                                className={clsx([
                                                    'text-ellipsis text-sm m0 color-weak',
                                                    !calendarAddress && 'calendar-email',
                                                ])}
                                                style={{ '--index': index }}
                                                title={calendarAddress}
                                            >
                                                {calendarAddress}
                                            </div>
                                        )}
                                    </div>
                                </div>,
                                <div data-test-id="calendar-settings-page:calendar-status" key="status">
                                    {badges.map(({ statusType, badgeType, text, tooltipText }) => (
                                        <CalendarBadge
                                            key={statusType}
                                            badgeType={badgeType}
                                            text={text}
                                            tooltipText={tooltipText}
                                        />
                                    ))}
                                </div>,
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
                                                shape="outline"
                                                className="mr0-5"
                                            >{c('Action').t`Make default`}</Button>
                                        )}
                                    <ButtonLike
                                        as={Link}
                                        to={`/calendar/calendars/${ID}`}
                                        shape="outline"
                                        icon
                                        disabled={!!isLoading}
                                    >
                                        <Icon name="cog-wheel" className="flex-item-noshrink" />
                                    </ButtonLike>
                                </div>,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default CalendarsTable;

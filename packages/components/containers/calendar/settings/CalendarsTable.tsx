import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { getCalendarStatusBadges } from '@proton/shared/lib/calendar/badges';
import { getCalendarSubpagePath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import {
    Icon,
    Info,
    SettingsLink,
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
    addresses: Address[];
    user: UserModel;
    onSetDefault?: (id: string) => Promise<void>;
    nameHeader?: string;
}

const CalendarsTable = ({
    calendars,
    defaultCalendarID,
    addresses,
    user,
    onSetDefault,
    nameHeader: inputNameHeader,
}: Props) => {
    const { hasNonDelinquentScope } = user;
    const [isLoading, setIsLoading] = useState<string>();

    const hasSingleAddress = addresses.length === 1;

    if (!calendars.length) {
        return null;
    }

    const nameHeader = inputNameHeader || c('Header').t`Name`;
    const statusHeader = (
        <div className="flex flex-align-items-center">
            <span className="mr-2">{c('Header').t`Status`}</span>
            <Info url={getKnowledgeBaseUrl('/calendar-status')} />
        </div>
    );

    return (
        <Table hasActions responsive="cards">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="text-left w50">{nameHeader}</TableHeaderCell>
                    <TableHeaderCell className="w20">{statusHeader}</TableHeaderCell>
                    <TableHeaderCell>{c('Header').t`Actions`}</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {calendars.map((calendar, index) => {
                    const { ID, Name, Color, Email } = calendar;

                    const { isDisabled, isDefault, isSubscribed, badges } = getCalendarStatusBadges(
                        calendar,
                        defaultCalendarID
                    );

                    return (
                        <TableRow key={ID}>
                            <TableCell label={nameHeader}>
                                <div key="id">
                                    <div className="grid-align-icon-center">
                                        <CalendarSelectIcon
                                            color={Color}
                                            className="mr-3 flex-item-noshrink keep-left"
                                        />
                                        <div className="text-ellipsis" title={Name}>
                                            {Name}
                                        </div>
                                        {!hasSingleAddress && (
                                            <div
                                                className={clsx(['text-ellipsis text-sm m-0 color-weak'])}
                                                style={{ '--index': index }}
                                                title={Email}
                                            >
                                                {Email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell label={statusHeader}>
                                <div data-testid="calendar-settings-page:calendar-status" key="status">
                                    {badges.map(({ statusType, badgeType, text, tooltipText }) => (
                                        <CalendarBadge
                                            key={statusType}
                                            badgeType={badgeType}
                                            text={text}
                                            tooltipText={tooltipText}
                                            className="mb-1 mr-2"
                                        />
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="inline-flex">
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
                                                className="mr-2"
                                            >{c('Action').t`Set as default`}</Button>
                                        )}
                                    <Tooltip title={c('Calendar table settings button tooltip').t`Open settings`}>
                                        <ButtonLike
                                            as={SettingsLink}
                                            app={APPS.PROTONCALENDAR}
                                            path={getCalendarSubpagePath(ID)}
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

import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { getCalendarStatusBadges } from '@proton/shared/lib/calendar/badges';
import { getCalendarSubpagePath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, UserModel } from '@proton/shared/lib/interfaces';
import type { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

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
        <div className="flex items-center">
            <span className="mr-2">{c('Header').t`Status`}</span>
            <Info url={getKnowledgeBaseUrl('/calendar-status')} />
        </div>
    );

    return (
        <Table hasActions responsive="cards">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="text-left w-1/2">{nameHeader}</TableHeaderCell>
                    <TableHeaderCell className="w-1/6">{statusHeader}</TableHeaderCell>
                    <TableHeaderCell className="text-left">{c('Header').t`Actions`}</TableHeaderCell>
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
                                        <CalendarSelectIcon color={Color} className="mr-3 shrink-0 keep-left" />
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
                                <div className="inline-flex flex-nowrap items-center">
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
                                            className="shrink-0"
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

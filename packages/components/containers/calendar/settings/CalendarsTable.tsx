import {
    getCalendarHasSubscriptionParameters,
    getCalendarIsNotSyncedInfo,
    getIsSubscribedCalendar,
} from '@proton/shared/lib/calendar/subscribe/helpers';
import { c } from 'ttag';
import { getIsCalendarDisabled, getIsCalendarProbablyActive } from '@proton/shared/lib/calendar/calendar';
import { VisualCalendar, SubscribedCalendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';
import { SimpleMap, UserModel } from '@proton/shared/lib/interfaces';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import React from 'react';
import { Badge, DropdownActions, Info, Table, TableBody, TableHeader, TableRow, Tooltip } from '../../../components';
import useGetCalendarsEmails from '../hooks/useGetCalendarsEmails';

import './CalendarsTable.scss';
import { classnames } from '../../../helpers';
import CalendarSelectIcon from '../../../components/calendarSelect/CalendarSelectIcon';

interface Props {
    calendars: (VisualCalendar | SubscribedCalendar)[];
    defaultCalendarID?: string;
    user: UserModel;
    onEdit: (calendar: VisualCalendar) => void;
    onSetDefault?: (id: string) => void;
    onDelete: (id: string) => void;
    onExport?: (calendar: VisualCalendar) => void;
    loadingMap: SimpleMap<boolean>;
    actionsDisabled: boolean;
}

const CalendarsTable = ({
    calendars = [],
    defaultCalendarID,
    user,
    onEdit,
    onSetDefault,
    onDelete,
    onExport,
    loadingMap,
    actionsDisabled = false,
}: Props) => {
    const { hasNonDelinquentScope } = user;
    const calendarAddressMap = useGetCalendarsEmails(calendars);

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

                    const isDisabled = getIsCalendarDisabled(calendar);
                    const isActive = getIsCalendarProbablyActive(calendar);
                    const isDefault = ID === defaultCalendarID;
                    const isSubscribed = getIsSubscribedCalendar(calendar);
                    const isNotSyncedInfo = getCalendarHasSubscriptionParameters(calendar)
                        ? getCalendarIsNotSyncedInfo(calendar)
                        : undefined;

                    const list: { text: string; onClick: () => void }[] = [
                        hasNonDelinquentScope && {
                            text: c('Action').t`Edit`,
                            onClick: () => onEdit(calendar),
                        },
                        !isSubscribed &&
                            !isDisabled &&
                            !isDefault &&
                            hasNonDelinquentScope &&
                            onSetDefault && {
                                text: c('Action').t`Set as default`,
                                onClick: () => onSetDefault(ID),
                            },
                        !isSubscribed &&
                            onExport && {
                                text: c('Action').t`Export ICS`,
                                onClick: () => onExport(calendar),
                            },
                        {
                            text: isSubscribed ? c('Action').t`Remove` : c('Action').t`Delete`,
                            actionType: 'delete',
                            onClick: () => onDelete(ID),
                        },
                    ].filter(isTruthy);

                    const calendarAddress = calendarAddressMap[ID] || '';

                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <div key="id">
                                    <div className="grid-align-icon">
                                        <CalendarSelectIcon
                                            color={Color}
                                            className="mr0-75 flex-item-noshrink keep-left"
                                        />
                                        <div className="text-ellipsis" title={Name}>
                                            {Name}
                                        </div>
                                        <div
                                            className={classnames([
                                                'text-ellipsis text-sm m0 color-weak',
                                                !calendarAddress && 'calendar-email',
                                            ])}
                                            style={{ '--index': index }}
                                            title={calendarAddress}
                                        >
                                            {calendarAddress}
                                        </div>
                                    </div>
                                </div>,
                                <div data-test-id="calendar-settings-page:calendar-status" key="status">
                                    {isDefault && <Badge type="primary">{c('Calendar status').t`Default`}</Badge>}
                                    {isActive && <Badge type="success">{c('Calendar status').t`Active`}</Badge>}
                                    {isDisabled && <Badge type="light">{c('Calendar status').t`Disabled`}</Badge>}
                                    {isSubscribed && isNotSyncedInfo && (
                                        <Tooltip title={isNotSyncedInfo.text}>
                                            <span>
                                                <Badge type="warning">{isNotSyncedInfo.label}</Badge>
                                            </span>
                                        </Tooltip>
                                    )}
                                </div>,
                                <DropdownActions
                                    className="button--small"
                                    key="actions"
                                    list={list}
                                    disabled={actionsDisabled}
                                    loading={!!loadingMap[ID]}
                                />,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default CalendarsTable;

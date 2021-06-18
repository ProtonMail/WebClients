import React from 'react';
import { c } from 'ttag';
import { getIsCalendarDisabled, getIsCalendarProbablyActive } from 'proton-shared/lib/calendar/calendar';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { UserModel } from 'proton-shared/lib/interfaces';

import { Badge, DropdownActions, Icon, Table, TableBody, TableHeader, TableRow } from '../../../components';
import useGetCalendarEmail from '../hooks/useGetCalendarEmail';

import './CalendarsTable.scss';
import { classnames } from '../../../helpers';

interface Props {
    calendars: Calendar[];
    defaultCalendarID?: string;
    user: UserModel;
    onEdit: (calendar: Calendar) => void;
    onSetDefault: (id: string) => void;
    onDelete: (calendar: Calendar) => void;
    onExport: (calendar: Calendar) => void;
    loadingMap: { [key: string]: boolean };
}
const CalendarsTable = ({
    calendars,
    defaultCalendarID,
    user,
    onEdit,
    onSetDefault,
    onDelete,
    onExport,
    loadingMap,
}: Props) => {
    const calendarAddressMap = useGetCalendarEmail(calendars);

    return (
        <Table className="simple-table--has-actions">
            <TableHeader cells={[c('Header').t`Name`, c('Header').t`Status`, c('Header').t`Actions`]} />
            <TableBody>
                {(calendars || []).map((calendar, index) => {
                    const { ID, Name, Color } = calendar;

                    const isDisabled = getIsCalendarDisabled(calendar);
                    const isActive = getIsCalendarProbablyActive(calendar);
                    const isDefault = ID === defaultCalendarID;

                    const list = [
                        user.hasNonDelinquentScope && {
                            text: c('Action').t`Edit`,
                            onClick: () => onEdit(calendar),
                        },
                        !isDisabled &&
                            !isDefault &&
                            user.hasNonDelinquentScope && {
                                text: c('Action').t`Set as default`,
                                onClick: () => onSetDefault(ID),
                            },
                        {
                            text: c('Action').t`Export ICS`,
                            onClick: () => onExport(calendar),
                        },
                        {
                            text: c('Action').t`Delete`,
                            actionType: 'delete',
                            onClick: () => onDelete(calendar),
                        } as const,
                    ].filter(isTruthy);

                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <div key="id">
                                    <div className="grid-align-icon">
                                        <Icon name="calendar" color={Color} className="mr0-5 flex-item-noshrink" />
                                        <div className="text-ellipsis" title={Name}>
                                            {Name}
                                        </div>
                                        <div
                                            className={classnames([
                                                'text-ellipsis text-sm m0 color-weak',
                                                !calendarAddressMap[ID] && 'calendar-email',
                                            ])}
                                            style={{ '--index': index }}
                                        >
                                            {calendarAddressMap[ID] || ''}
                                        </div>
                                    </div>
                                </div>,
                                <div data-test-id="calendar-settings-page:calendar-status" key="status">
                                    {isDefault && <Badge type="primary">{c('Calendar status').t`Default`}</Badge>}
                                    {isActive && <Badge type="success">{c('Calendar status').t`Active`}</Badge>}
                                    {isDisabled && <Badge type="warning">{c('Calendar status').t`Disabled`}</Badge>}
                                </div>,
                                <DropdownActions
                                    className="button--small"
                                    key="actions"
                                    list={list}
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

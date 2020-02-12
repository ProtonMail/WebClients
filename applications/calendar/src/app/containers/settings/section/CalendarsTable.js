import React from 'react';
import { c } from 'ttag';
import { Icon, Table, TableHeader, TableBody, TableRow, DropdownActions, Badge } from 'react-components';

const CalendarsTable = ({ calendars, defaultCalendarID, onEdit, onSetDefault, onDelete, disabled, loadingMap }) => {
    return (
        <Table>
            <TableHeader cells={[c('Header').t`Name`, c('Header').t`Status`, c('Header').t`Actions`]} />
            <TableBody>
                {(calendars || []).map((calendar) => {
                    const { ID, Name, Color } = calendar;
                    const list = [
                        {
                            text: c('Action').t`Edit`,
                            onClick: () => onEdit(calendar)
                        },
                        ID !== defaultCalendarID && {
                            text: c('Action').t`Set as default`,
                            onClick: () => onSetDefault(ID)
                        },
                        {
                            text: c('Action').t`Delete`,
                            onClick: () => onDelete(calendar)
                        }
                    ].filter(Boolean);
                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <div key="id" className="flex flex-nowrap flex-items-center">
                                    <Icon name="calendar" color={Color} className="mr0-5 flex-item-noshrink" />
                                    <span className="ellipsis" title={Name}>
                                        {Name}
                                    </span>
                                </div>,
                                <div key="status">
                                    {ID === defaultCalendarID && <Badge>{c('Key badge').t`Default`}</Badge>}
                                </div>,
                                <DropdownActions
                                    className="pm-button--small"
                                    key="actions"
                                    list={list}
                                    disabled={disabled}
                                    loading={!!loadingMap[ID]}
                                />
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default CalendarsTable;

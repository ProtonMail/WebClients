import React from 'react';
import { c } from 'ttag';
import { Icon, Table, TableHeader, TableBody, TableRow, DropdownActions } from 'react-components';

const CalendarsTable = ({ calendars, onEdit, onDelete, loadingMap }) => {
    return (
        <Table>
            <TableHeader cells={[c('Header').t`Name`, c('Header').t`Actions`]} />
            <TableBody>
                {(calendars || []).map((calendar) => {
                    const { ID, Name, Color } = calendar;
                    const list = [
                        {
                            text: c('Action').t`Edit`,
                            onClick: () => onEdit(calendar)
                        },
                        {
                            text: c('Action').t`Delete`,
                            onClick: () => onDelete(calendar)
                        }
                    ];
                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <div key={0} className="flex flex-nowrap flex-items-center">
                                    <Icon name="calendar" color={Color} className="mr0-5 flex-item-noshrink" />
                                    <span className="ellipsis" title={Name}>
                                        {Name}
                                    </span>
                                </div>,
                                <DropdownActions
                                    className="pm-button--small"
                                    key={1}
                                    list={list}
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

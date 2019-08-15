import React from 'react';
import { c } from 'ttag';
import {
    Icon,
    Alert,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    DropdownActions,
    useCalendars,
    useApi,
    useEventManager,
    useNotifications,
    useModals,
    ConfirmModal
} from 'react-components';
import { removeCalendar } from 'proton-shared/lib/api/calendars';

import CalendarModal from '../modals/calendar/CalendarModal';

const CalendarsTable = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [calendars, loadingCalendars] = useCalendars();
    const headers = [c('Header').t`Name`, c('Header').t`Actions`];

    return (
        <Table loading={loadingCalendars}>
            <TableHeader cells={headers} />
            <TableBody>
                {(calendars || []).map((calendar) => {
                    const { ID, Name, Color } = calendar;
                    const list = [
                        {
                            text: c('Action').t`Edit`,
                            onClick() {
                                createModal(<CalendarModal calendar={calendar} />);
                            }
                        },
                        calendars.length > 0 && {
                            text: c('Action').t`Delete`,
                            async onClick() {
                                await new Promise((resolve, reject) => {
                                    createModal(
                                        <ConfirmModal onClose={reject} onConfirm={resolve}>
                                            <Alert>{c('Info').t`Are you sure you want to delete this calendar?`}</Alert>
                                        </ConfirmModal>
                                    );
                                });
                                await api(removeCalendar(ID));
                                await call();
                                createNotification({ text: c('Success').t`Calendar removed` });
                            }
                        }
                    ].filter(Boolean);

                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <div key={ID}>
                                    <Icon name="calendar" color={Color} className="mr0-5" />
                                    {Name}
                                </div>,
                                <DropdownActions className="pm-group-button pm-button--small" key={ID} list={list} />
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default CalendarsTable;

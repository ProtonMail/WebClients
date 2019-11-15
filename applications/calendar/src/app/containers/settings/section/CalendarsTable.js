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
    useLoading,
    useModals,
    ConfirmModal
} from 'react-components';
import { removeCalendar } from 'proton-shared/lib/api/calendars';

import CalendarModal from '../CalendarModal';

const CalendarsTable = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [calendars, loadingCalendars] = useCalendars();
    const [loading, withLoading] = useLoading();

    const handleDelete = async (ID) => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Confirm delete`} onClose={reject} onConfirm={resolve}>
                    <Alert>{c('Info').t`Are you sure you want to delete this calendar?`}</Alert>
                </ConfirmModal>
            );
        });
        await api(removeCalendar(ID));
        await call();
        createNotification({ text: c('Success').t`Calendar removed` });
    };

    return (
        <Table loading={loadingCalendars}>
            <TableHeader cells={[c('Header').t`Name`, c('Header').t`Actions`]} />
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
                        calendars.length > 1 && {
                            text: c('Action').t`Delete`,
                            onClick() {
                                withLoading(handleDelete(ID));
                            }
                        }
                    ].filter(Boolean);

                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <div key={0} className="flex flex-items-center">
                                    <Icon name="calendar" color={Color} className="mr0-5" />
                                    {Name}
                                </div>,
                                <DropdownActions className="pm-button--small" key={1} list={list} loading={loading} />
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default CalendarsTable;

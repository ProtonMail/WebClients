import React from 'react';
import { c } from 'ttag';
import {
    Icon,
    Alert,
    FormModal,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    Toggle,
    DropdownActions,
    useCalendars,
    useApi,
    useEventManager,
    useNotifications,
    useLoading,
    useModals,
    ConfirmModal
} from 'react-components';
import { updateCalendar, removeCalendar } from 'proton-shared/lib/api/calendars';
import CalendarModal from './CalendarModal';

const CalendarsModal = (props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [calendars, loadingCalendars] = useCalendars();
    const headers = [c('Header').t`Name`, c('Header').t`Display`, c('Header').t`Actions`];

    const handleDisplay = async (calendarID, checked) => {
        await api(updateCalendar(calendarID, { Display: +checked }));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <FormModal
            title={c('Title').t`Manage calendars`}
            hasSubmit={false}
            loading={loading || loadingCalendars}
            close={c('Action').t`Close`}
            {...props}
        >
            <Table>
                <TableHeader cells={headers} />
                <TableBody>
                    {(calendars || []).map((calendar) => {
                        const { ID, Name, Display, Color } = calendar;
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
                                                <Alert>{c('Info')
                                                    .t`Are you sure you want to delete this calendar?`}</Alert>
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
                                    <Toggle
                                        key={ID}
                                        loading={loading}
                                        checked={!!Display}
                                        onChange={({ target }) => withLoading(handleDisplay(ID, target.checked))}
                                    />,
                                    <DropdownActions
                                        className="pm-group-button pm-button--small"
                                        key={ID}
                                        list={list}
                                    />
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </FormModal>
    );
};

export default CalendarsModal;

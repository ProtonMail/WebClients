import React, { useState } from 'react';
import {
    useApi,
    useEventManager,
    useNotifications,
    SubTitle,
    PrimaryButton,
    ErrorButton,
    useModals,
    ConfirmModal,
    Alert
} from 'react-components';
import { c } from 'ttag';
import { updateCalendarUserSettings, removeCalendar } from 'proton-shared/lib/api/calendars';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { Address } from 'proton-shared/lib/interfaces';

import CalendarsTable from './CalendarsTable';
import CalendarModal from '../CalendarModal';
import { MAX_CALENDARS_PER_USER } from '../../../constants';

interface Props {
    addresses: Address[];
    calendars: Calendar[];
    disabledCalendars: Calendar[];
    activeCalendars: Calendar[];
    defaultCalendar?: Calendar;
}
const CalendarsSection = ({ addresses, calendars, defaultCalendar, disabledCalendars, activeCalendars }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [loadingMap, setLoadingMap] = useState({});

    const defaultCalendarID = defaultCalendar ? defaultCalendar.ID : undefined;
    const hasDisabledCalendar = disabledCalendars.length > 0;

    const handleCreate = () => {
        createModal(<CalendarModal activeCalendars={activeCalendars} defaultCalendarID={defaultCalendarID} />);
    };

    const handleEdit = (calendar: Calendar) => {
        createModal(<CalendarModal calendar={calendar} />);
    };

    const handleSetDefault = async (calendarID: string) => {
        try {
            setLoadingMap((old) => ({ ...old, [calendarID]: true }));
            await api(updateCalendarUserSettings({ DefaultCalendarID: calendarID }));
            await call();
            createNotification({ text: c('Success').t`Default calendar updated` });
        } finally {
            setLoadingMap((old) => ({ ...old, [calendarID]: false }));
        }
    };

    const handleDelete = async ({ ID }: Calendar) => {
        const isDeleteDefaultCalendar = ID === defaultCalendarID;
        const firstRemainingCalendar = activeCalendars.find(({ ID: calendarID }) => calendarID !== ID);

        // If deleting the default calendar, the new calendar to make default is either the first active calendar or null if there is none.
        const newDefaultCalendarID = isDeleteDefaultCalendar
            ? (firstRemainingCalendar && firstRemainingCalendar.ID) || null
            : undefined;

        await new Promise((resolve, reject) => {
            const calendarName = firstRemainingCalendar ? (
                <span key="calendar-name" className="break">
                    {firstRemainingCalendar.Name}
                </span>
            ) : (
                ''
            );
            createModal(
                <ConfirmModal
                    title={c('Title').t`Delete calendar`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    onClose={reject}
                    onConfirm={resolve}
                >
                    <Alert type="error">{c('Info').t`Are you sure you want to delete this calendar?`}</Alert>
                    {isDeleteDefaultCalendar && firstRemainingCalendar && (
                        <Alert type="warning">{c('Info').jt`${calendarName} will be set as default calendar.`}</Alert>
                    )}
                </ConfirmModal>
            );
        });
        try {
            setLoadingMap((old) => ({
                ...old,
                [newDefaultCalendarID || '']: true,
                [ID]: true
            }));
            await api(removeCalendar(ID));
            // null is a valid default calendar id
            if (newDefaultCalendarID !== undefined) {
                await api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID }));
            }
            await call();
            createNotification({ text: c('Success').t`Calendar removed` });
        } finally {
            setLoadingMap((old) => ({ ...old, [newDefaultCalendarID || '']: false, [ID]: false }));
        }
    };

    const canAddCalendar = addresses.length > 0 && calendars.length < MAX_CALENDARS_PER_USER;

    return (
        <>
            <SubTitle>{c('Title').t`Calendars`}</SubTitle>
            <div className="mb1">
                <PrimaryButton
                    data-test-id="calendar-setting-page:add-calendar"
                    disabled={!canAddCalendar}
                    onClick={handleCreate}
                >
                    {c('Action').t`Add calendar`}
                </PrimaryButton>
            </div>
            {hasDisabledCalendar ? (
                <Alert>
                    {c('Disabled calendar')
                        .t`A calendar is marked as disabled when it is linked to a disabled email address. You can still access your disabled calendar and view events in read-only mode or delete them. You can enable the calendar by re-enabling the email address.`}
                </Alert>
            ) : null}
            <CalendarsTable
                calendars={calendars}
                defaultCalendarID={defaultCalendarID}
                onEdit={handleEdit}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
                loadingMap={loadingMap}
            />
        </>
    );
};

export default CalendarsSection;

import { removeCalendar, updateCalendarUserSettings } from 'proton-shared/lib/api/calendars';
import { MAX_CALENDARS_PER_FREE_USER, MAX_CALENDARS_PER_USER } from 'proton-shared/lib/calendar/constants';
import { Address, UserModel } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import React, { useState } from 'react';
import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton } from '../../../components';
import { useApi, useEventManager, useModals, useNotifications } from '../../../hooks';
import { CalendarModal } from '../calendarModal/CalendarModal';
import { ExportModal } from '../exportModal/ExportModal';
import CalendarsSection from './CalendarsSection';

interface Props {
    activeAddresses: Address[];
    calendars: Calendar[];
    disabledCalendars: Calendar[];
    activeCalendars: Calendar[];
    defaultCalendar?: Calendar;
    user: UserModel;
}
const PersonalCalendarsSection = ({
    activeAddresses,
    calendars = [],
    defaultCalendar,
    disabledCalendars = [],
    activeCalendars = [],
    user,
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [loadingMap, setLoadingMap] = useState({});

    const defaultCalendarID = defaultCalendar?.ID;

    const handleCreate = () => {
        return createModal(<CalendarModal activeCalendars={activeCalendars} defaultCalendarID={defaultCalendarID} />);
    };

    const handleEdit = (calendar: Calendar) => {
        return createModal(<CalendarModal calendar={calendar} />);
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

    const handleDelete = async (id: string) => {
        const isDeleteDefaultCalendar = id === defaultCalendarID;
        const firstRemainingCalendar = activeCalendars.find(({ ID: calendarID }) => calendarID !== id);

        // If deleting the default calendar, the new calendar to make default is either the first active calendar or null if there is none.
        const newDefaultCalendarID = isDeleteDefaultCalendar
            ? (firstRemainingCalendar && firstRemainingCalendar.ID) || null
            : undefined;

        await new Promise<void>((resolve, reject) => {
            const calendarName = firstRemainingCalendar ? (
                <span key="calendar-name" className="text-break">
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
                [id]: true,
            }));
            await api(removeCalendar(id));
            // null is a valid default calendar id
            if (newDefaultCalendarID !== undefined) {
                await api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID }));
            }
            await call();
            createNotification({ text: c('Success').t`Calendar removed` });
        } finally {
            setLoadingMap((old) => ({ ...old, [newDefaultCalendarID || '']: false, [id]: false }));
        }
    };

    const handleExport = (calendar: Calendar) => createModal(<ExportModal calendar={calendar} />);

    const calendarsLimit = user.isFree ? MAX_CALENDARS_PER_FREE_USER : MAX_CALENDARS_PER_USER;
    const isBelowLimit = calendars.length < calendarsLimit;

    return (
        <CalendarsSection
            calendars={calendars}
            user={user}
            defaultCalendarID={defaultCalendar?.ID}
            loadingMap={loadingMap}
            add={c('Action').t`Add calendar`}
            hasDisabledCalendar={disabledCalendars.length > 0}
            calendarsLimit={calendarsLimit}
            canAdd={activeAddresses.length > 0 && isBelowLimit && user.hasNonDelinquentScope}
            onAdd={handleCreate}
            onSetDefault={handleSetDefault}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onExport={handleExport}
        />
    );
};

export default PersonalCalendarsSection;

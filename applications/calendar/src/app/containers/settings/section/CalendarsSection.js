import React, { useState } from 'react';
import PropTypes from 'prop-types';
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

import CalendarsTable from './CalendarsTable';
import CalendarModal from '../CalendarModal';
import { updateCalendarUserSettings, removeCalendar } from 'proton-shared/lib/api/calendars';
import { MAX_CALENDARS_PER_USER } from '../../../constants';

const CalendarsSection = ({ calendars, defaultCalendarID, disabled }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [loadingMap, setLoadingMap] = useState({});

    const handleCreate = () => {
        createModal(<CalendarModal calendars={calendars} defaultCalendarID={defaultCalendarID} />);
    };

    const handleEdit = (calendar) => {
        createModal(<CalendarModal calendar={calendar} />);
    };

    const handleSetDefault = async (calendarID) => {
        try {
            setLoadingMap((old) => ({ ...old, [calendarID]: true }));
            await api(updateCalendarUserSettings({ DefaultCalendarID: calendarID }));
            await call();
            createNotification({ text: c('Success').t`Default calendar updated` });
        } finally {
            setLoadingMap((old) => ({ ...old, [calendarID]: false }));
        }
    };

    const handleDelete = async ({ ID }) => {
        const deleteDefaultCalendar = ID === defaultCalendarID;
        const firstRemainingCalendar = calendars.find(({ ID: calendarID }) => calendarID !== ID);
        const newDefaultCalendarID = (firstRemainingCalendar && firstRemainingCalendar.ID) || null;

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
                    {deleteDefaultCalendar && firstRemainingCalendar && (
                        <Alert type="warning">{c('Info').jt`${calendarName} will be set as default calendar.`}</Alert>
                    )}
                </ConfirmModal>
            );
        });
        try {
            setLoadingMap((old) => ({ ...old, [newDefaultCalendarID]: true, [ID]: true }));
            await api(removeCalendar(ID));
            if (deleteDefaultCalendar) {
                await api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID }));
            }
            await call();
            createNotification({ text: c('Success').t`Calendar removed` });
        } finally {
            setLoadingMap((old) => ({ ...old, [newDefaultCalendarID]: false, [ID]: false }));
        }
    };

    const canAddCalendar = calendars.length < MAX_CALENDARS_PER_USER;

    return (
        <>
            <SubTitle>{c('Title').t`Calendars`}</SubTitle>
            <div className="mb1">
                <PrimaryButton disabled={!canAddCalendar || disabled} onClick={handleCreate}>
                    {c('Action').t`Add calendar`}
                </PrimaryButton>
            </div>
            <CalendarsTable
                calendars={calendars}
                defaultCalendarID={defaultCalendarID}
                onEdit={handleEdit}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
                disabled={disabled}
                loadingMap={loadingMap}
            />
        </>
    );
};

CalendarsSection.propTypes = {
    calendars: PropTypes.array,
    defaultCalendarID: PropTypes.oneOfType([PropTypes.string, null]),
    disabled: PropTypes.bool
};

export default CalendarsSection;

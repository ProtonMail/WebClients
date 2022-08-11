import React from 'react';
import { useHistory } from 'react-router';

import { c } from 'ttag';

import { Alert, AlertModal, Button, ErrorButton, useModalState } from '@proton/components/components';
import { SettingsParagraph } from '@proton/components/containers';
import { useApi, useEventManager, useLoading, useNotifications } from '@proton/components/hooks';
import { removeCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import SettingsSection from '../../account/SettingsSection';

interface Props {
    personalActiveCalendars: VisualCalendar[];
    calendar: VisualCalendar;
    defaultCalendar?: VisualCalendar;
}

const CalendarDeleteSection = ({ personalActiveCalendars, calendar, defaultCalendar }: Props) => {
    const history = useHistory();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading(false);

    const [deleteModal, setIsDeleteModalOpen, renderDeleteModal] = useModalState();

    const isSubscribedCalendar = getIsSubscribedCalendar(calendar);
    const isDeleteDefaultCalendar = calendar.ID === defaultCalendar?.ID;
    const firstRemainingCalendar = personalActiveCalendars.find(({ ID: calendarID }) => calendarID !== calendar.ID);

    const modalTitle = isSubscribedCalendar
        ? c('Remove calendar section title').t`Unsubscribe?`
        : c('Remove calendar section title').t`Delete calendar?`;
    const modalText = isSubscribedCalendar
        ? c('Info').t`This calendar will be removed from your account.`
        : c('Info').t`Are you sure you want to delete this calendar? All events in it will be deleted.`;
    const deleteText = isSubscribedCalendar ? c('Action').t`Unsubscribe` : c('Action').t`Delete`;
    const description = isSubscribedCalendar
        ? c('Remove calendar section description')
              .t`By unsubscribing, you will no longer have access to this calendar. All events in this calendar will be deleted from your account, but they'll remain in the original publick link.`
        : c('Delete calendar section description').t`All events in this calendar will be deleted.`;

    const firstRemainingCalendarName = firstRemainingCalendar ? (
        <span className="text-strong text-break" key="calendar-name">
            {firstRemainingCalendar.Name}
        </span>
    ) : null;
    const deleteDefaultAlertText =
        isDeleteDefaultCalendar && firstRemainingCalendarName
            ? c('Info').jt`${firstRemainingCalendarName} will be set as default calendar.`
            : '';

    const handleDelete = async () => {
        // If deleting the default calendar, the new calendar to make default is either the first active calendar or null if there is none.
        const newDefaultCalendarID = isDeleteDefaultCalendar ? firstRemainingCalendar?.ID || null : undefined;

        await withLoading(
            (async () => {
                await api(removeCalendar(calendar.ID));
                // null is a valid default calendar id
                if (newDefaultCalendarID !== undefined) {
                    // do not make this operation blocking, but growl about it
                    await api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID })).catch(noop);
                }
                await call();
            })()
        );

        createNotification({ text: c('Success').t`Calendar removed` });
        deleteModal.onClose();
        history.replace('/calendar/calendars');
    };

    return (
        <>
            {renderDeleteModal && (
                <AlertModal
                    {...deleteModal}
                    title={modalTitle}
                    buttons={[
                        <Button color="danger" onClick={handleDelete} loading={loading} type="submit">
                            {deleteText}
                        </Button>,
                        <Button onClick={deleteModal.onClose} type="submit">{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    <div className="mb1">{modalText}</div>
                    {deleteDefaultAlertText}
                </AlertModal>
            )}
            <SettingsSection large>
                <div className="h2 mb0-25 text-bold">{c('Remove calendar section title').t`Remove calendar`}</div>
                <SettingsParagraph>{description}</SettingsParagraph>
                {deleteDefaultAlertText && <Alert className="mb1">{deleteDefaultAlertText}</Alert>}
                <ErrorButton onClick={() => setIsDeleteModalOpen(true)}>{deleteText}</ErrorButton>
            </SettingsSection>
        </>
    );
};

export default CalendarDeleteSection;

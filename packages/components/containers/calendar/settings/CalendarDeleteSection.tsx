import React from 'react';
import { useHistory } from 'react-router';

import { c } from 'ttag';

import { Alert, AlertModal, Button, ErrorButton, useModalState } from '@proton/components/components';
import { SettingsParagraph } from '@proton/components/containers';
import { useApi, useEventManager, useLoading, useNotifications } from '@proton/components/hooks';
import { removeCalendar, removeMember, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import {
    getIsOwnedCalendar,
    getOwnedPersonalCalendars,
    getProbablyActiveCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import SettingsSection from '../../account/SettingsSection';

const getTexts = ({
    isSubscribedCalendar,
    isSharedAsMember,
    isSharedAsOwner,
}: {
    isSubscribedCalendar: boolean;
    isSharedAsMember: boolean;
    isSharedAsOwner: boolean;
}) => {
    if (isSubscribedCalendar) {
        return {
            modalTitle: c('Remove calendar section title').t`Unsubscribe?`,
            modalText: c('Remove calendar section text').t`This calendar will be removed from your account.`,
            description: c('Remove calendar section description')
                .t`By unsubscribing, you will no longer have access to this calendar. All events in this calendar will be deleted from your account, but they'll remain in the original public link.`,
            deleteText: c('Action').t`Unsubscribe`,
        };
    }
    if (isSharedAsMember) {
        return {
            modalTitle: c('Remove calendar section title').t`Leave calendar?`,
            modalText: c('Remove calendar section text')
                .t`If you leave this calendar, you'll have to ask the owner to join again.`,
            description: c('Remove calendar section description').t`You will no longer have access to this calendar.`,
            deleteText: c('Action').t`Delete`,
        };
    }
    return {
        modalTitle: c('Remove calendar section title').t`Delete calendar?`,
        modalText: isSharedAsOwner
            ? c('Info')
                  .t`Are you sure you want to delete this calendar? All addresses you shared this calendar with will lose access to it.`
            : c('Info').t`Are you sure you want to delete this calendar? All events in it will be deleted.`,
        description: c('Delete calendar section description').t`All events in this calendar will be deleted.`,
        deleteText: c('Action').t`Delete`,
    };
};

interface Props {
    calendars: VisualCalendar[];
    calendar: VisualCalendar;
    defaultCalendar?: VisualCalendar;
    isShared: boolean;
}

const CalendarDeleteSection = ({ calendars, calendar, defaultCalendar, isShared }: Props) => {
    const history = useHistory();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading(false);

    const [deleteModal, setIsDeleteModalOpen, renderDeleteModal] = useModalState();

    const isSubscribedCalendar = getIsSubscribedCalendar(calendar);
    const isOwner = getIsOwnedCalendar(calendar);
    const isDeleteDefaultCalendar = calendar.ID === defaultCalendar?.ID;
    const firstRemainingCalendar = getProbablyActiveCalendars(getOwnedPersonalCalendars(calendars)).find(
        ({ ID: calendarID }) => calendarID !== calendar.ID
    );

    const { modalTitle, modalText, description, deleteText } = getTexts({
        isSubscribedCalendar,
        isSharedAsOwner: isOwner && isShared,
        isSharedAsMember: !isOwner,
    });

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
                if (getIsOwnedCalendar(calendar)) {
                    await api(removeCalendar(calendar.ID));

                    // null is a valid default calendar id
                    if (newDefaultCalendarID !== undefined) {
                        // do not make this operation blocking, but growl about it
                        await api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID })).catch(noop);
                    }
                } else {
                    await api(removeMember(calendar.ID, calendar.Members[0].ID));
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
                        <Button disabled={loading} onClick={deleteModal.onClose} type="submit">{c('Action')
                            .t`Cancel`}</Button>,
                    ]}
                >
                    <div className="mb1">{modalText}</div>
                    {deleteDefaultAlertText}
                </AlertModal>
            )}
            <SettingsSection className="container-section-sticky-section">
                <div className="h2 mb0-25 text-bold">{c('Remove calendar section title').t`Remove calendar`}</div>
                <SettingsParagraph large>{description}</SettingsParagraph>
                {deleteDefaultAlertText && <Alert className="mb1">{deleteDefaultAlertText}</Alert>}
                <ErrorButton onClick={() => setIsDeleteModalOpen(true)}>{deleteText}</ErrorButton>
            </SettingsSection>
        </>
    );
};

export default CalendarDeleteSection;

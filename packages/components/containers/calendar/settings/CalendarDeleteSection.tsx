import { useHistory } from 'react-router';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ErrorButton } from '@proton/components/components';
import Alert from '@proton/components/components/alert/Alert';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import { SettingsParagraph } from '@proton/components/containers';
import { getNextDefaultCalendar } from '@proton/components/containers/calendar/settings/defaultCalendar';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import {
    removeCalendar,
    removeHolidaysCalendar,
    removeMember,
    updateCalendarUserSettings,
} from '@proton/shared/lib/api/calendars';
import {
    getIsHolidaysCalendar,
    getIsOwnedCalendar,
    getIsPersonalCalendar,
    getIsSubscribedCalendar,
    getOwnedPersonalCalendars,
    getProbablyActiveCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import SettingsSection from '../../account/SettingsSection';

const getTexts = ({
    isSubscribedCalendar,
    isHolidaysCalendar,
    isSharedAsMember,
    isSharedAsOwner,
}: {
    isSubscribedCalendar: boolean;
    isHolidaysCalendar: boolean;
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
    if (isHolidaysCalendar) {
        return {
            modalTitle: c('Remove calendar section title').t`Delete calendar?`,
            // translator: A holidays calendar includes bank holidays and observances
            modalText: c('Info')
                .t`Are you sure you want to delete this calendar? You can add the holidays calendar back later.`,
            description: c('Delete calendar section description').t`You will no longer have access to this calendar.`,
            deleteText: c('Action').t`Delete`,
        };
    }
    if (isSharedAsMember) {
        return {
            modalTitle: c('Remove calendar section title').t`Leave calendar?`,
            modalText: c('Remove calendar section text')
                .t`If you leave this calendar, you'll have to ask the owner to join again.`,
            description: c('Remove calendar section description').t`You will no longer have access to this calendar.`,
            deleteText: c('Action').t`Leave`,
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
    const isHolidaysCalendar = getIsHolidaysCalendar(calendar);
    const isOwner = getIsOwnedCalendar(calendar);
    const isSharedAsOwner = getIsPersonalCalendar(calendar) && isOwner && isShared;
    const isSharedAsMember = getIsPersonalCalendar(calendar) && !isOwner;
    const isDeleteDefaultCalendar = calendar.ID === defaultCalendar?.ID;
    const firstRemainingCalendar = getProbablyActiveCalendars(getOwnedPersonalCalendars(calendars)).find(
        ({ ID: calendarID }) => calendarID !== calendar.ID
    );

    const { modalTitle, modalText, description, deleteText } = getTexts({
        isSubscribedCalendar,
        isHolidaysCalendar,
        isSharedAsOwner,
        isSharedAsMember,
    });

    const deleteDefaultAlertText =
        isDeleteDefaultCalendar && firstRemainingCalendar ? getNextDefaultCalendar(firstRemainingCalendar) : '';

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
                    // If holiday calendar, we want to use the route which does not need password confirmation
                    const removeCalendar = isHolidaysCalendar
                        ? removeHolidaysCalendar(calendar.ID)
                        : removeMember(calendar.ID, calendar.Members[0].ID);
                    await api(removeCalendar);
                }

                await call();
            })()
        );

        createNotification({ text: c('Success').t`Calendar removed` });
        deleteModal.onClose();
        history.replace(getCalendarsSettingsPath({ fullPath: true }));
    };

    return (
        <>
            {renderDeleteModal && (
                <Prompt
                    {...deleteModal}
                    title={modalTitle}
                    buttons={[
                        <Button color="danger" onClick={handleDelete} loading={loading} type="submit">
                            {deleteText}
                        </Button>,
                        <Button disabled={loading} onClick={deleteModal.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    <div className="mb-4">{modalText}</div>
                    {deleteDefaultAlertText}
                </Prompt>
            )}
            <SettingsSection className="container-section-sticky-section">
                <div className="h2 mb-1 text-bold">{c('Remove calendar section title').t`Remove calendar`}</div>
                <SettingsParagraph large>{description}</SettingsParagraph>
                {deleteDefaultAlertText && <Alert className="mb-4">{deleteDefaultAlertText}</Alert>}
                <ErrorButton onClick={() => setIsDeleteModalOpen(true)}>{deleteText}</ErrorButton>
            </SettingsSection>
        </>
    );
};

export default CalendarDeleteSection;

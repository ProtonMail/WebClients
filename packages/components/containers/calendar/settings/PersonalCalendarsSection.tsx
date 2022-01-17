import { ReactNode, useState } from 'react';
import { c } from 'ttag';

import { removeCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { MAX_CALENDARS_PER_FREE_USER, MAX_CALENDARS_PER_USER } from '@proton/shared/lib/calendar/constants';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';

import { AlertModal, Button } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { useModalsMap } from '../../../hooks/useModalsMap';
import { CalendarModal } from '../calendarModal/CalendarModal';
import { ExportModal } from '../exportModal/ExportModal';
import CalendarsSection from './CalendarsSection';

type ModalsMap = {
    calendarModal: ModalWithProps<{
        activeCalendars?: Calendar[];
        defaultCalendarID?: string;
        calendar?: Calendar;
    }>;
    exportCalendarModal: ModalWithProps<{
        exportCalendar?: Calendar;
    }>;
    deleteCalendarModal: ModalWithProps<{
        defaultCalendarWarning?: ReactNode;
        onClose: () => void;
        onConfirm: () => void;
    }>;
};

export interface PersonalCalendarsSectionProps {
    activeAddresses: Address[];
    calendars: Calendar[];
    activeCalendars: Calendar[];
    defaultCalendar?: Calendar;
    user: UserModel;
}

const PersonalCalendarsSection = ({
    activeAddresses,
    calendars = [],
    defaultCalendar,
    activeCalendars = [],
    user,
}: PersonalCalendarsSectionProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingMap, setLoadingMap] = useState({});
    const { modalsMap, updateModal, closeModal } = useModalsMap<ModalsMap>({
        calendarModal: { isOpen: false },
        exportCalendarModal: { isOpen: false },
        deleteCalendarModal: { isOpen: false },
    });

    const defaultCalendarID = defaultCalendar?.ID;

    const handleCreate = () => {
        updateModal('calendarModal', {
            isOpen: true,
            props: { activeCalendars, defaultCalendarID },
        });
    };

    const handleEdit = (calendar: Calendar) => {
        updateModal('calendarModal', {
            isOpen: true,
            props: { calendar },
        });
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
            const defaultCalendarWarning =
                isDeleteDefaultCalendar && firstRemainingCalendar ? (
                    <div className="mb1">{c('Info').jt`${calendarName} will be set as default calendar.`}</div>
                ) : null;

            updateModal('deleteCalendarModal', {
                isOpen: true,
                props: {
                    onClose: () => {
                        reject();
                        closeModal('deleteCalendarModal');
                    },
                    onConfirm: () => {
                        resolve();
                        closeModal('deleteCalendarModal');
                    },
                    defaultCalendarWarning,
                },
            });
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

    const handleExport = (exportCalendar: Calendar) => {
        updateModal('exportCalendarModal', {
            isOpen: true,
            props: { exportCalendar },
        });
    };

    const calendarsLimit = user.isFree ? MAX_CALENDARS_PER_FREE_USER : MAX_CALENDARS_PER_USER;
    const calendarLimitReachedText = c('Calendar limit warning')
        .t`You have reached the maximum number of personal calendars you can create within your plan.`;
    const isBelowLimit = calendars.length < calendarsLimit;

    const { calendarModal, exportCalendarModal, deleteCalendarModal } = modalsMap;

    return (
        <>
            <AlertModal
                open={deleteCalendarModal.isOpen}
                title={c('Title').t`Delete calendar`}
                buttons={[
                    <Button color="danger" onClick={deleteCalendarModal.props?.onConfirm} type="submit">{c('Action')
                        .t`Delete`}</Button>,
                    <Button onClick={deleteCalendarModal.props?.onClose} type="submit">{c('Action').t`Cancel`}</Button>,
                ]}
                onClose={deleteCalendarModal.props?.onClose}
            >
                <div className="mb1">{c('Info').t`Are you sure you want to delete this calendar?`}</div>
                {deleteCalendarModal.props?.defaultCalendarWarning}
            </AlertModal>
            {!!exportCalendarModal.props?.exportCalendar && (
                <ExportModal
                    calendar={exportCalendarModal.props?.exportCalendar}
                    isOpen={exportCalendarModal.isOpen}
                    onClose={() => closeModal('exportCalendarModal')}
                />
            )}

            {!!calendarModal.props && calendarModal.isOpen && (
                <CalendarModal {...calendarModal.props} isOpen onClose={() => closeModal('calendarModal')} />
            )}

            <CalendarsSection
                calendars={calendars}
                user={user}
                defaultCalendarID={defaultCalendar?.ID}
                loadingMap={loadingMap}
                add={c('Action').t`Create calendar`}
                calendarLimitReachedText={calendarLimitReachedText}
                canAdd={activeAddresses.length > 0 && isBelowLimit && user.hasNonDelinquentScope}
                onAdd={handleCreate}
                onSetDefault={handleSetDefault}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onExport={handleExport}
            />
        </>
    );
};

export default PersonalCalendarsSection;

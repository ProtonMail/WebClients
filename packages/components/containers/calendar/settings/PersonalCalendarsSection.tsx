import { ReactNode, useMemo, useState } from 'react';
import { c } from 'ttag';

import { removeCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SettingsParagraph } from '@proton/components/containers';

import { AlertModal, Button, Href, useModalState } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { useModalsMap } from '../../../hooks/useModalsMap';
import { CalendarModal } from '../calendarModal/CalendarModal';
import { ExportModal } from '../exportModal/ExportModal';
import CalendarsSection from './CalendarsSection';

type ModalsMap = {
    calendarModal: ModalWithProps<{
        activeCalendars?: VisualCalendar[];
        defaultCalendarID?: string;
        calendar?: VisualCalendar;
    }>;
    exportCalendarModal: ModalWithProps<{
        exportCalendar?: VisualCalendar;
    }>;
    deleteCalendarModal: ModalWithProps<{
        defaultCalendarWarning?: ReactNode;
        onClose: () => void;
        onConfirm: () => void;
    }>;
};

export interface PersonalCalendarsSectionProps {
    addresses: Address[];
    calendars: VisualCalendar[];
    activeCalendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    user: UserModel;
}

const PersonalCalendarsSection = ({
    addresses,
    calendars,
    defaultCalendar,
    activeCalendars,
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

    const activeAddresses = useMemo(() => {
        return getActiveAddresses(addresses);
    }, [addresses]);
    const [{ open: isCalendarModalOpen, onExit: onExitCalendarModal, ...calendarModalProps }, setIsCalendarModalOpen] =
        useModalState();
    const [{ open: isExportModalOpen, onExit: onExitExportModal, ...exportModalProps }, setIsExportModalOpen] =
        useModalState();

    const defaultCalendarID = defaultCalendar?.ID;

    const handleCreate = () => {
        setIsCalendarModalOpen(true);
        updateModal('calendarModal', {
            isOpen: true,
            props: { activeCalendars, defaultCalendarID },
        });
    };

    const handleEdit = (calendar: VisualCalendar) => {
        setIsCalendarModalOpen(true);
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

    const handleExport = (exportCalendar: VisualCalendar) => {
        setIsExportModalOpen(true);
        updateModal('exportCalendarModal', {
            isOpen: true,
            props: { exportCalendar },
        });
    };

    const calendarsLimit = user.hasPaidMail ? MAX_CALENDARS_PAID : MAX_CALENDARS_FREE;
    const calendarLimitReachedText = c('Calendar limit warning')
        .t`You have reached the maximum number of personal calendars you can create within your plan.`;
    const isBelowLimit = calendars.length < calendarsLimit;
    const canAdd = activeAddresses.length > 0 && isBelowLimit && user.hasNonDelinquentScope;

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
                    {...exportCalendarModal}
                    {...exportModalProps}
                    calendar={exportCalendarModal.props?.exportCalendar}
                    isOpen={isExportModalOpen}
                    onExit={() => {
                        onExitCalendarModal?.();
                        updateModal('exportCalendarModal', {
                            isOpen: false,
                            props: undefined,
                        });
                    }}
                />
            )}

            {!!calendarModal.props && (
                <CalendarModal
                    {...calendarModal.props}
                    {...calendarModalProps}
                    open={isCalendarModalOpen}
                    onExit={() => {
                        onExitCalendarModal?.();
                        updateModal('calendarModal', {
                            isOpen: false,
                            props: undefined,
                        });
                    }}
                />
            )}

            <CalendarsSection
                calendars={calendars}
                user={user}
                defaultCalendarID={defaultCalendar?.ID}
                loadingMap={loadingMap}
                add={c('Action').t`Create calendar`}
                calendarLimitReachedText={calendarLimitReachedText}
                canAdd={canAdd}
                description={
                    canAdd &&
                    !calendars.length && (
                        <SettingsParagraph>
                            {c('Personal calendar section description')
                                .t`Create a calendar to stay on top of your schedule while keeping your data secure.`}
                            <br />
                            <Href url={getKnowledgeBaseUrl('/protoncalendar-calendars')}>{c('Knowledge base link label')
                                .t`Learn more`}</Href>
                        </SettingsParagraph>
                    )
                }
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

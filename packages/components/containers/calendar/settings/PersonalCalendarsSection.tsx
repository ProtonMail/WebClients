import { ReactNode } from 'react';

import { c } from 'ttag';

import { SettingsParagraph, SharedCalendarsSection } from '@proton/components/containers';
import { removeCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import {
    getOwnedPersonalCalendars,
    getProbablyActiveCalendars,
    groupCalendarsByTaxonomy,
} from '@proton/shared/lib/calendar/calendar';
import getHasUserReachedCalendarsLimit from '@proton/shared/lib/calendar/getHasUserReachedCalendarsLimit';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import { CalendarMemberInvitation, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { AlertModal, Button, Href, useModalState } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { useModalsMap } from '../../../hooks/useModalsMap';
import { CalendarModal } from '../calendarModal/CalendarModal';
import { ExportModal } from '../exportModal/ExportModal';
import CalendarsSection from './CalendarsSection';

const getCalendarsLimitReachedText = ({
    hasInvitations,
    isPersonalCalendarsLimitReached,
    isSharedCalendarsLimitReached,
}: {
    hasInvitations: boolean;
    isPersonalCalendarsLimitReached: boolean;
    isSharedCalendarsLimitReached: boolean;
}) => {
    if (!isPersonalCalendarsLimitReached && !isSharedCalendarsLimitReached) {
        return '';
    }

    if (isPersonalCalendarsLimitReached) {
        return hasInvitations
            ? c('Calendar limit warning')
                  .t`You have reached the maximum number of personal calendars you can have. To accept pending calendar invitations, you need to remove some of your calendars.`
            : c('Calendar limit warning')
                  .t`You have reached the maximum number of personal calendars you can create within your plan.`;
    }

    return hasInvitations
        ? c('Calendar limit warning')
              .t`You have reached the maximum number of shared calendars you can have. To accept pending calendar invitations, you need to remove some of your calendars.`
        : '';
};

type ModalsMap = {
    calendarModal: ModalWithProps<{
        calendars?: VisualCalendar[];
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
    user: UserModel;
    calendars: VisualCalendar[];
    calendarInvitations: CalendarMemberInvitation[];
    defaultCalendar?: VisualCalendar;
}

const PersonalCalendarsSection = ({
    addresses,
    user,
    calendars,
    defaultCalendar,
    calendarInvitations,
}: PersonalCalendarsSectionProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const { modalsMap, updateModal, closeModal } = useModalsMap<ModalsMap>({
        calendarModal: { isOpen: false },
        exportCalendarModal: { isOpen: false },
        deleteCalendarModal: { isOpen: false },
    });
    const [{ onExit: onExitCalendarModal, ...calendarModalProps }, setIsCalendarModalOpen] = useModalState();
    const [{ open: isExportModalOpen, onExit: onExitExportModal, ...exportModalProps }, setIsExportModalOpen] =
        useModalState();

    const defaultCalendarID = defaultCalendar?.ID;

    const handleCreateCalendar = () => {
        setIsCalendarModalOpen(true);
        updateModal('calendarModal', {
            isOpen: true,
            props: { calendars, defaultCalendarID },
        });
    };

    const handleEditCalendar = (calendar: VisualCalendar) => {
        setIsCalendarModalOpen(true);
        updateModal('calendarModal', {
            isOpen: true,
            props: { calendar },
        });
    };

    const handleSetDefaultCalendar = async (calendarID: string) => {
        await api(updateCalendarUserSettings({ DefaultCalendarID: calendarID }));
        await call();
        createNotification({ text: c('Success').t`Default calendar updated` });
    };

    const handleDeleteCalendar = async (id: string) => {
        const isDeleteDefaultCalendar = id === defaultCalendarID;
        const firstRemainingCalendar = getProbablyActiveCalendars(getOwnedPersonalCalendars(calendars)).find(
            ({ ID: calendarID }) => calendarID !== id
        );

        // If deleting the default calendar, the new calendar to make default is either the first active calendar or null if there is none.
        const newDefaultCalendarID = isDeleteDefaultCalendar
            ? (firstRemainingCalendar && firstRemainingCalendar.ID) || null
            : undefined;

        await new Promise<void>((resolve, reject) => {
            const calendarName = firstRemainingCalendar ? (
                <span key="bold-calendar-name" className="text-bold text-break">
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
        await api(removeCalendar(id));
        // null is a valid default calendar id
        if (newDefaultCalendarID !== undefined) {
            await api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID }));
        }
        await call();
        createNotification({ text: c('Success').t`Calendar removed` });
    };

    const handleExportCalendar = (exportCalendar: VisualCalendar) => {
        setIsExportModalOpen(true);
        updateModal('exportCalendarModal', {
            isOpen: true,
            props: { exportCalendar },
        });
    };

    const { ownedPersonalCalendars, sharedCalendars } = groupCalendarsByTaxonomy(calendars);
    const { isPersonalCalendarsLimitReached, isSharedCalendarsLimitReached } = getHasUserReachedCalendarsLimit({
        calendars,
        isFreeUser: !user.hasPaidMail,
    });
    const canAddCalendars =
        getActiveAddresses(addresses).length > 0 && user.hasNonDelinquentScope && !isPersonalCalendarsLimitReached;
    const canAddSharedCalendars = canAddCalendars && !isSharedCalendarsLimitReached;
    const calendarsLimitReachedText = getCalendarsLimitReachedText({
        hasInvitations: !!calendarInvitations.length,
        isPersonalCalendarsLimitReached,
        isSharedCalendarsLimitReached,
    });

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
                    calendar={exportCalendarModal.props.exportCalendar}
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
                calendars={ownedPersonalCalendars}
                user={user}
                defaultCalendarID={defaultCalendar?.ID}
                add={c('Action').t`Create calendar`}
                calendarsLimitReachedText={calendarsLimitReachedText}
                canAdd={canAddCalendars}
                canUpgradeCalendarsLimit={!user.hasPaidMail}
                description={
                    <SettingsParagraph>
                        {c('Personal calendar section description')
                            .t`Create a calendar to stay on top of your schedule while keeping your data secure.`}
                        <br />
                        <Href url={getKnowledgeBaseUrl('/protoncalendar-calendars')}>{c('Knowledge base link label')
                            .t`Learn more`}</Href>
                    </SettingsParagraph>
                }
                onAdd={handleCreateCalendar}
                onSetDefault={handleSetDefaultCalendar}
                onEdit={handleEditCalendar}
                onDelete={handleDeleteCalendar}
                onExport={handleExportCalendar}
            />
            <SharedCalendarsSection
                user={user}
                addresses={addresses}
                calendars={sharedCalendars}
                calendarInvitations={calendarInvitations}
                canAddCalendars={canAddSharedCalendars}
            />
        </>
    );
};

export default PersonalCalendarsSection;

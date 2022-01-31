import { ComponentPropsWithoutRef, useState, useRef } from 'react';
import { c, msgid } from 'ttag';

import { removeCalendar } from '@proton/shared/lib/api/calendars';
import { MAX_SUBSCRIBED_CALENDARS_PER_USER } from '@proton/shared/lib/calendar/constants';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';

import { AlertModal, Button, Href, useModalState } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { CalendarModal } from '../calendarModal/CalendarModal';
import useSubscribedCalendars from '../../../hooks/useSubscribedCalendars';
import SubscribeCalendarModal from '../subscribeCalendarModal/SubscribeCalendarModal';
import CalendarsSection from './CalendarsSection';
import { SettingsParagraph } from '../../account';
import { useModalsMap } from '../../../hooks/useModalsMap';

type ModalsMap = {
    calendarModal: ModalWithProps<{
        editCalendar?: Calendar;
    }>;
    subscribeCalendarModal: ModalWithProps;
    deleteCalendarModal: ModalWithProps;
};

export interface SubscribedCalendarsSectionProps extends ComponentPropsWithoutRef<'div'> {
    activeAddresses: Address[];
    calendars: Calendar[];
    user: UserModel;
    unavailable?: boolean;
}

const SubscribedCalendarsSection = ({
    activeAddresses,
    calendars = [],
    user,
    unavailable,
    ...rest
}: SubscribedCalendarsSectionProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingMap, setLoadingMap] = useState({});
    const { subscribedCalendars, loading } = useSubscribedCalendars(calendars);

    const [{ open: isCalendarModalOpen, onExit: onExitCalendarModal, ...calendarModalProps }, setIsCalendarModalOpen] =
        useModalState();

    const confirm = useRef<{ resolve: (param?: any) => any; reject: () => any }>();

    const { modalsMap, updateModal, closeModal } = useModalsMap<ModalsMap>({
        calendarModal: { isOpen: false },
        subscribeCalendarModal: { isOpen: false },
        deleteCalendarModal: { isOpen: false },
    });

    const handleCreate = () => {
        updateModal('subscribeCalendarModal', { isOpen: true });
    };

    const handleEdit = (editCalendar: Calendar) => {
        setIsCalendarModalOpen(true);
        updateModal('calendarModal', { isOpen: true, props: { editCalendar } });
    };

    const handleDelete = async (id: string) => {
        await new Promise<void>((resolve, reject) => {
            updateModal('deleteCalendarModal', { isOpen: true });
            confirm.current = { resolve, reject };
        });

        try {
            setLoadingMap((old) => ({
                ...old,
                [id]: true,
            }));
            await api(removeCalendar(id));
            await call();
            createNotification({ text: c('Success').t`Calendar removed` });
        } finally {
            setLoadingMap((old) => ({ ...old, [id]: false }));
        }
    };

    const canAddCalendar =
        user.hasNonDelinquentScope &&
        activeAddresses.length > 0 &&
        calendars.length < MAX_SUBSCRIBED_CALENDARS_PER_USER;

    const { deleteCalendarModal, calendarModal, subscribeCalendarModal } = modalsMap;

    return (
        <>
            <AlertModal
                open={deleteCalendarModal.isOpen}
                title={c('Title').t`Remove calendar`}
                buttons={[
                    <Button
                        color="danger"
                        onClick={() => {
                            confirm.current?.resolve();
                            closeModal('deleteCalendarModal');
                        }}
                    >{c('Action').t`Remove calendar`}</Button>,
                    <Button
                        onClick={() => {
                            confirm.current?.reject();
                            closeModal('deleteCalendarModal');
                        }}
                    >{c('Action').t`Cancel`}</Button>,
                ]}
                onClose={() => confirm.current?.reject()}
            >
                {c('Info').t`The calendar will be removed from your account.`}
            </AlertModal>

            <SubscribeCalendarModal
                isOpen={subscribeCalendarModal.isOpen}
                onClose={() => closeModal('subscribeCalendarModal')}
            />
            {calendarModal.props?.editCalendar && (
                <CalendarModal
                    {...calendarModalProps}
                    isOpen={isCalendarModalOpen}
                    calendar={calendarModal.props.editCalendar}
                    onExit={() => {
                        onExitCalendarModal?.();
                        updateModal('calendarModal', { isOpen: true, props: undefined });
                    }}
                />
            )}
            <CalendarsSection
                calendars={loading ? calendars : subscribedCalendars}
                user={user}
                loading={loading}
                loadingMap={loadingMap}
                canAdd={canAddCalendar}
                isFeatureUnavailable={unavailable}
                add={c('Action').t`Add calendar`}
                calendarLimitReachedText={c('Calendar limit warning').ngettext(
                    msgid`You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS_PER_USER} subscribed calendar.`,
                    `You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS_PER_USER} subscribed calendars.`,
                    MAX_SUBSCRIBED_CALENDARS_PER_USER
                )}
                description={
                    <SettingsParagraph>
                        {c('Subscribed calendar section description')
                            .t`Add public, external, or shared calendars using a URL.`}
                        <br />
                        <Href url="https://protonmail.com/support/knowledge-base/calendar-subscribe">{c(
                            'Knowledge base link label'
                        ).t`Here's how`}</Href>
                    </SettingsParagraph>
                }
                onAdd={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canUpgradeLimit={false}
                {...rest}
            />
        </>
    );
};

export default SubscribedCalendarsSection;

import { ComponentPropsWithoutRef, useMemo, useRef } from 'react';

import { c, msgid } from 'ttag';

import { removeCalendar } from '@proton/shared/lib/api/calendars';
import { MAX_SUBSCRIBED_CALENDARS } from '@proton/shared/lib/calendar/constants';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { AlertModal, Button, Href, useModalState } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { useModalsMap } from '../../../hooks/useModalsMap';
import { SettingsParagraph } from '../../account';
import { CalendarModal } from '../calendarModal/CalendarModal';
import SubscribedCalendarModal from '../subscribedCalendarModal/SubscribedCalendarModal';
import CalendarsSection from './CalendarsSection';

type ModalsMap = {
    calendarModal: ModalWithProps<{
        editCalendar?: VisualCalendar;
    }>;
    subscribeCalendarModal: ModalWithProps;
    deleteCalendarModal: ModalWithProps;
};

export interface SubscribedCalendarsSectionProps extends ComponentPropsWithoutRef<'div'> {
    addresses: Address[];
    calendars: SubscribedCalendar[];
    user: UserModel;
    unavailable?: boolean;
}

const SubscribedCalendarsSection = ({
    addresses,
    calendars = [],
    user,
    unavailable,
    ...rest
}: SubscribedCalendarsSectionProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const activeAddresses = useMemo(() => {
        return getActiveAddresses(addresses);
    }, [addresses]);
    const [{ onExit: onExitCalendarModal, ...calendarModalProps }, setIsCalendarModalOpen] = useModalState();

    const confirm = useRef<{ resolve: (param?: any) => any; reject: () => any }>();

    const { modalsMap, updateModal, closeModal } = useModalsMap<ModalsMap>({
        calendarModal: { isOpen: false },
        subscribeCalendarModal: { isOpen: false },
        deleteCalendarModal: { isOpen: false },
    });

    const handleCreate = () => {
        updateModal('subscribeCalendarModal', { isOpen: true });
    };

    const handleEdit = (editCalendar: VisualCalendar) => {
        setIsCalendarModalOpen(true);
        updateModal('calendarModal', { isOpen: true, props: { editCalendar } });
    };

    const handleDelete = async (id: string) => {
        await new Promise<void>((resolve, reject) => {
            updateModal('deleteCalendarModal', { isOpen: true });
            confirm.current = { resolve, reject };
        });

        await api(removeCalendar(id));
        await call();
        createNotification({ text: c('Success').t`Calendar removed` });
    };

    const canAddCalendar =
        user.hasNonDelinquentScope && activeAddresses.length > 0 && calendars.length < MAX_SUBSCRIBED_CALENDARS;
    const calendarsLimitReachedText = !canAddCalendar
        ? c('Calendar limit warning').ngettext(
              msgid`You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS} subscribed calendar.`,
              `You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS} subscribed calendars.`,
              MAX_SUBSCRIBED_CALENDARS
          )
        : '';

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

            <SubscribedCalendarModal
                open={subscribeCalendarModal.isOpen}
                onClose={() => closeModal('subscribeCalendarModal')}
            />
            {calendarModal.props?.editCalendar && (
                <CalendarModal
                    {...calendarModalProps}
                    calendar={calendarModal.props.editCalendar}
                    onExit={() => {
                        onExitCalendarModal?.();
                        updateModal('calendarModal', { isOpen: true, props: undefined });
                    }}
                />
            )}
            <CalendarsSection
                calendars={calendars}
                user={user}
                canAdd={canAddCalendar}
                isFeatureUnavailable={unavailable}
                add={c('Action').t`Add calendar`}
                calendarsLimitReachedText={calendarsLimitReachedText}
                description={
                    <SettingsParagraph>
                        {c('Subscribed calendar section description')
                            .t`Add public, external, or shared calendars using a URL.`}
                        <br />
                        <Href url={getKnowledgeBaseUrl('/subscribe-to-external-calendar')}>{c(
                            'Knowledge base link label'
                        ).t`Here's how`}</Href>
                    </SettingsParagraph>
                }
                onAdd={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canUpgradeCalendarsLimit={false}
                {...rest}
            />
        </>
    );
};

export default SubscribedCalendarsSection;

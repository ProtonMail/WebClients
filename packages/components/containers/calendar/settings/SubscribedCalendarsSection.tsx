import { ComponentPropsWithoutRef, useState, useRef, useMemo } from 'react';
import { c, msgid } from 'ttag';

import { removeCalendar } from '@proton/shared/lib/api/calendars';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { MAX_SUBSCRIBED_CALENDARS } from '@proton/shared/lib/calendar/constants';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { AlertModal, Button, Href, useModalState } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { CalendarModal } from '../calendarModal/CalendarModal';
import SubscribeCalendarModal from '../subscribeCalendarModal/SubscribeCalendarModal';
import CalendarsSection from './CalendarsSection';
import { SettingsParagraph } from '../../account';
import { useModalsMap } from '../../../hooks/useModalsMap';

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
    const [loadingMap, setLoadingMap] = useState({});

    const activeAddresses = useMemo(() => {
        return getActiveAddresses(addresses);
    }, [addresses]);
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

    const handleEdit = (editCalendar: VisualCalendar) => {
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
        user.hasNonDelinquentScope && activeAddresses.length > 0 && calendars.length < MAX_SUBSCRIBED_CALENDARS;

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
                    open={isCalendarModalOpen}
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
                loadingMap={loadingMap}
                canAdd={canAddCalendar}
                isFeatureUnavailable={unavailable}
                add={c('Action').t`Add calendar`}
                calendarLimitReachedText={c('Calendar limit warning').ngettext(
                    msgid`You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS} subscribed calendar.`,
                    `You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS} subscribed calendars.`,
                    MAX_SUBSCRIBED_CALENDARS
                )}
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
                canUpgradeLimit={false}
                {...rest}
            />
        </>
    );
};

export default SubscribedCalendarsSection;

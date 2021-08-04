import { removeCalendar } from '@proton/shared/lib/api/calendars';
import { MAX_SUBSCRIBED_CALENDARS_PER_USER } from '@proton/shared/lib/calendar/constants';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { useState } from 'react';
import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton } from '../../../components';
import { useApi, useEventManager, useModals, useNotifications } from '../../../hooks';
import { CalendarModal } from '../calendarModal/CalendarModal';
import useSubscribedCalendars from '../../../hooks/useSubscribedCalendars';
import SubscribeCalendarModal from '../subscribeCalendarModal/SubscribeCalendarModal';
import CalendarsSection from './CalendarsSection';

interface Props {
    activeAddresses: Address[];
    calendars: Calendar[];
    user: UserModel;
}
const SubscribedCalendarsSection = ({ activeAddresses, calendars = [], user }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [loadingMap, setLoadingMap] = useState({});
    const { subscribedCalendars, loading } = useSubscribedCalendars(calendars);

    const handleCreate = () => {
        return createModal(<SubscribeCalendarModal />);
    };

    const handleEdit = (calendar: Calendar) => {
        return createModal(<CalendarModal calendar={calendar} />);
    };

    const handleDelete = async (id: string) => {
        const title = c('Title').t`Unsubscribe from calendar`;
        const confirmText = c('Action').t`Unsubscribe`;
        const alertText = c('Info')
            .t`The calendar will be deleted and won’t be synchronised anymore with the link provided.`;

        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={title}
                    confirm={<ErrorButton type="submit">{confirmText}</ErrorButton>}
                    onClose={reject}
                    onConfirm={resolve}
                >
                    <Alert type="error">{alertText}</Alert>
                </ConfirmModal>
            );
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

    return (
        <CalendarsSection
            calendars={loading ? calendars : subscribedCalendars}
            user={user}
            loading={loading}
            loadingMap={loadingMap}
            calendarsLimit={MAX_SUBSCRIBED_CALENDARS_PER_USER}
            canAdd={canAddCalendar}
            add={c('Action').t`Subscribe to calendar`}
            onAdd={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canUpgradeLimit={false}
        />
    );
};

export default SubscribedCalendarsSection;

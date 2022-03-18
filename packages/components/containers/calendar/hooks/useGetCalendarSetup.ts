import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { c } from 'ttag';

import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { Calendar, CalendarViewModelFull, SubscribedCalendar } from '@proton/shared/lib/interfaces/calendar';

import { getCalendarModel } from '../calendarModal/calendarModalState';
import { useGetAddresses, useGetCalendarBootstrap, useLoading, useNotifications } from '../../../hooks';

interface Props {
    calendar?: Calendar | SubscribedCalendar;
    setModel: Dispatch<SetStateAction<CalendarViewModelFull>>;
}

const useGetCalendarSetup = ({ calendar: initialCalendar, setModel }: Props) => {
    const getAddresses = useGetAddresses();
    const getCalendarBootstrap = useGetCalendarBootstrap();

    const [loading, withLoading] = useLoading(true);
    const { createNotification } = useNotifications();

    const [error, setError] = useState(false);

    useEffect(() => {
        const initializeEmptyCalendar = async () => {
            const activeAdresses = getActiveAddresses(await getAddresses());
            if (!activeAdresses.length) {
                setError(true);
                return createNotification({ text: c('Error').t`No valid address found`, type: 'error' });
            }

            setModel((prev) => ({
                ...prev,
                addressID: activeAdresses[0].ID,
                addressOptions: activeAdresses.map(({ ID, Email = '' }) => ({ value: ID, text: Email })),
            }));
        };

        const initializeCalendar = async () => {
            if (!initialCalendar) {
                throw new Error('No initial calendar');
            }

            const [{ Members, CalendarSettings }, Addresses] = await Promise.all([
                getCalendarBootstrap(initialCalendar.ID),
                getAddresses(),
            ]);

            const [{ Email: memberEmail } = { Email: '' }] = Members;
            const { ID: AddressID } = Addresses.find(({ Email }) => memberEmail === Email) || {};

            if (!AddressID) {
                setError(true);
                return createNotification({ text: c('Error').t`No valid address found`, type: 'error' });
            }

            setModel((prev) => ({
                ...prev,
                ...getCalendarModel({
                    Calendar: initialCalendar,
                    CalendarSettings,
                    Addresses,
                    AddressID,
                }),
            }));
        };

        const promise = initialCalendar ? initializeCalendar() : initializeEmptyCalendar();

        void withLoading(
            promise.catch(() => {
                setError(true);
            })
        );
    }, []);

    return { loading, error };
};

export default useGetCalendarSetup;

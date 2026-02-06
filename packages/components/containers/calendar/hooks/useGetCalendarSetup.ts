import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { getActiveAddresses, getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import type { CalendarViewModelFull, SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { getCalendarModel } from '../calendarModal/personalCalendarModal/calendarModalState';

interface Props {
    calendar?: VisualCalendar | SubscribedCalendar;
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
            const activeAddresses = getActiveAddresses(await getAddresses()).filter(
                (address) => !getIsBYOEAddress(address)
            );
            if (!activeAddresses.length) {
                setError(true);
                return createNotification({ text: c('Error').t`No valid address found`, type: 'error' });
            }

            setModel((prev) => ({
                ...prev,
                addressID: activeAddresses[0].ID,
                addressOptions: activeAddresses.map(({ ID, Email = '' }) => ({ value: ID, text: Email })),
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

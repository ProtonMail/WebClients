import React, { useState, useRef, useEffect } from 'react';
import { c } from 'ttag';
import {
    FormModal,
    useLoading,
    useEventManager,
    useApi,
    useModals,
    useGetAddresses,
    useGetAddressKeys,
    useNotifications,
    GenericError,
    Button,
} from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { createCalendar, updateCalendarUserSettings } from 'proton-shared/lib/api/calendars';
import { wait } from 'proton-shared/lib/helpers/promise';
import { getTimezone } from 'proton-shared/lib/date/timezone';
import getPrimaryKey from 'proton-shared/lib/keys/getPrimaryKey';

import { getActiveAddresses } from 'proton-shared/lib/helpers/address';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { DEFAULT_CALENDAR } from '../../constants';
import CalendarModal from '../settings/CalendarModal';
import CalendarCreating from './CalendarCreating';
import CalendarReady from './CalendarReady';
import { setupCalendarKey } from './reset/setupCalendarKeys';

interface Props {
    onClose?: () => void;
    onExit?: () => void;
    [key: string]: any;
}

const WelcomeModal = ({ onClose, ...rest }: Props) => {
    const calendarRef = useRef<Calendar>();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const api = useApi();
    const [isLoading, withLoading] = useLoading();
    const [error, setError] = useState(false);

    const title = isLoading ? c('Title').t`Preparing your calendar` : c('Title').t`Welcome to ProtonCalendar`;

    const handleCustomize = () => {
        if (!calendarRef.current) {
            return;
        }
        onClose?.();
        createModal(<CalendarModal calendar={calendarRef.current} defaultColor />);
    };

    const setup = async () => {
        const activeAddresses = getActiveAddresses(await getAddresses());
        if (!activeAddresses.length) {
            throw new Error(c('Error').t`No valid address found`);
        }

        const [{ ID: addressID }] = activeAddresses;
        const { privateKey: primaryAddressKey } = getPrimaryKey(await getAddressKeys(addressID)) || {};
        if (!primaryAddressKey) {
            throw new Error(c('Error').t`Primary address key is not decrypted.`);
        }

        const { Calendar } = await api<{ Calendar: Calendar }>(
            createCalendar({
                Name: DEFAULT_CALENDAR.name,
                Color: DEFAULT_CALENDAR.color,
                Description: DEFAULT_CALENDAR.description,
                Display: 1,
                AddressID: addressID,
            })
        );

        await Promise.all([
            api(
                updateCalendarUserSettings({
                    PrimaryTimezone: getTimezone(),
                    AutoDetectPrimaryTimezone: 1,
                })
            ),
            setupCalendarKey({
                api,
                calendarID: Calendar.ID,
                addresses: activeAddresses,
                getAddressKeys,
            }),
        ]);

        await call();

        calendarRef.current = Calendar;
    };

    useEffect(() => {
        // Wait intentionally to let the user see the loading state
        withLoading(
            Promise.all([setup(), wait(3000)]).catch((error) => {
                // if not coming from API error
                if (error.message && !error.config) {
                    createNotification({ text: error.message, type: 'error' });
                }
                console.error(error);
                setError(true);
            })
        );
    }, []);

    return (
        <FormModal
            loading={isLoading}
            title={title}
            hasClose={false}
            close={
                error ? null : (
                    <Button type="button" disabled={isLoading} onClick={handleCustomize}>
                        {c('Action').t`Customize calendar`}
                    </Button>
                )
            }
            submit={error ? null : c('Action').t`Continue`}
            onSubmit={isLoading || error ? noop : onClose}
            {...rest}
            onClose={isLoading || error ? noop : onClose}
            small
        >
            {error ? <GenericError /> : isLoading ? <CalendarCreating /> : <CalendarReady />}
        </FormModal>
    );
};

export default WelcomeModal;

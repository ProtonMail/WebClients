import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    FormModal,
    useLoading,
    useEventManager,
    useApi,
    useModals,
    useGetAddresses,
    useGetAddressKeys,
    useNotifications
} from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { createCalendar } from 'proton-shared/lib/api/calendars';
import { wait } from 'proton-shared/lib/helpers/promise';

import { setupCalendarKey } from '../../helpers/calendarModal';
import { DEFAULT_CALENDAR } from '../../constants';
import CalendarModal from '../../containers/settings/CalendarModal';
import CalendarCreating from './CalendarCreating';
import CalendarReady from './CalendarReady';

const WelcomeModal = (props) => {
    const calendarRef = useRef();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const api = useApi();
    const [isLoading, withLoading] = useLoading();
    const title = isLoading ? c('Title').t`Preparing your calendar` : c('Title').t`Welcome to ProtonCalendar!`;

    const handleCustomize = () => {
        if (!calendarRef.current) {
            return;
        }
        props.onClose();
        createModal(<CalendarModal onClose={() => {}} calendar={calendarRef.current} />);
    };

    const setup = async () => {
        const addresses = await getAddresses();
        if (!addresses.length) {
            createNotification({ text: c('Error').t`Please create an address first.`, type: 'error' });
            return;
        }

        const [{ ID: primaryAddressID, Email: email = '' }] = addresses;
        const { Calendar = {} } = await api(
            createCalendar({
                AddressID: primaryAddressID,
                Name: DEFAULT_CALENDAR.name,
                Color: DEFAULT_CALENDAR.color,
                Description: DEFAULT_CALENDAR.description,
                Display: 1
            })
        );

        await setupCalendarKey({
            api,
            addressID: primaryAddressID,
            addressKeys: await getAddressKeys(primaryAddressID),
            calendarID: Calendar.ID,
            email
        });

        await call();

        calendarRef.current = Calendar;
    };

    useEffect(() => {
        withLoading(Promise.all([setup(), wait(2000)])); // Wait intentionally 2 seconds to let the user see the loading state
    }, []);

    return (
        <FormModal
            loading={isLoading}
            title={title}
            hasClose={false}
            close={c('Action').t`Customize calendar`}
            submit={c('Action').t`Continue`}
            onSubmit={isLoading ? noop : props.onClose}
            {...props}
            onClose={isLoading ? noop : handleCustomize}
        >
            {isLoading ? <CalendarCreating /> : <CalendarReady />}
        </FormModal>
    );
};

WelcomeModal.propTypes = {
    addresses: PropTypes.array,
    user: PropTypes.object
};

export default WelcomeModal;

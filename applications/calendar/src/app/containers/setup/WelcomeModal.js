import React, { useState, useRef, useEffect } from 'react';
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
    useNotifications,
    GenericError,
    Button
} from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import {
    createCalendar,
    queryMembers,
    setupCalendar,
    updateCalendarUserSettings
} from 'proton-shared/lib/api/calendars';
import { wait } from 'proton-shared/lib/helpers/promise';
import { getTimezone } from 'proton-shared/lib/date/timezone';
import { getPrimaryKey } from 'proton-shared/lib/keys/keys';
import { generateCalendarKeyPayload, getKeysMemberMap } from 'proton-shared/lib/keys/calendarKeys';

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
    const [error, setError] = useState();
    const title = isLoading ? c('Title').t`Preparing your calendar` : c('Title').t`Welcome to ProtonCalendar`;

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
            throw new Error(c('Error').t`Please create an address first.`);
        }

        const [{ ID: primaryAddressID, Email: primaryAddressEmail = '' }] = addresses;
        const { privateKey: primaryAddressKey, publicKey: primaryAddressPublicKey } =
            getPrimaryKey(await getAddressKeys(primaryAddressID)) || {};
        if (!primaryAddressKey || !primaryAddressKey.isDecrypted()) {
            throw new Error(c('Error').t`Primary address key is not decrypted.`);
        }

        const calendarPayload = {
            Name: DEFAULT_CALENDAR.name,
            Color: DEFAULT_CALENDAR.color,
            Description: DEFAULT_CALENDAR.description,
            Display: 1,
            AddressID: primaryAddressID
        };

        const { Calendar = {} } = await api(createCalendar(calendarPayload));
        const { Members = [] } = await api(queryMembers(Calendar.ID));

        const calendarKeyPayload = await generateCalendarKeyPayload({
            addressID: primaryAddressID,
            calendarID: Calendar.ID,
            privateKey: primaryAddressKey,
            memberPublicKeys: getKeysMemberMap(Members, {
                [primaryAddressEmail]: primaryAddressPublicKey
            })
        });

        await Promise.all([
            api(updateCalendarUserSettings({ PrimaryTimezone: getTimezone(), AutoDetectPrimaryTimezone: 0 })),
            api(setupCalendar(Calendar.ID, calendarKeyPayload))
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
            onSubmit={isLoading || error ? noop : props.onClose}
            {...props}
            onClose={isLoading || error ? noop : props.onClose}
            small={true}
        >
            {error ? <GenericError /> : isLoading ? <CalendarCreating /> : <CalendarReady />}
        </FormModal>
    );
};

WelcomeModal.propTypes = {
    addresses: PropTypes.array,
    user: PropTypes.object,
    onClose: PropTypes.func
};

export default WelcomeModal;

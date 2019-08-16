import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Alert,
    FormModal,
    useLoading,
    useUser,
    useEventManager,
    useApi,
    useAddressesKeys,
    useModals,
    useUserKeys
} from 'react-components';
import { createCalendar } from 'proton-shared/lib/api/calendars';
import calendarSvg from 'design-system/assets/img/pm-images/calendar.svg';

import { setupCalendarKey } from '../../helpers/calendarModal';
import { DEFAULT_CALENDAR } from '../../constants';
import CalendarModal from './calendar/CalendarModal';

const WelcomeModal = ({ addresses, ...rest }) => {
    const [calendar, setCalendar] = useState();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [user] = useUser();
    const [userKeysList] = useUserKeys(user);
    const [addressesKeysMap, loadingAddressKeys] = useAddressesKeys(user, addresses, userKeysList);
    const [loading, withLoading] = useLoading();
    const title = loading ? c('Title').t`Preparing your calendar` : c('Title').t`Welcome to ProtonCalendar!`;

    const handleStart = () => rest.onClose();

    const handleCustomize = () => {
        rest.onClose();
        createModal(<CalendarModal calendar={calendar} />);
    };

    const setup = async () => {
        const [{ ID: addressID, Email: email = '' }] = addresses;
        const { Calendar = {} } = await api(
            createCalendar({
                AddressID: addressID,
                Name: DEFAULT_CALENDAR.name,
                Color: DEFAULT_CALENDAR.color,
                Description: DEFAULT_CALENDAR.description,
                Display: 1
            })
        );

        await setupCalendarKey({
            api,
            addressID,
            addressKeys: addressesKeysMap[addressID],
            calendarID: Calendar.ID,
            email
        });

        await call();
        setCalendar(Calendar);
    };

    useEffect(() => {
        if (!loadingAddressKeys && addressesKeysMap) {
            withLoading(setup());
        }
    }, [addresses, addressesKeysMap]);

    return (
        <FormModal
            loading={loading || loadingAddressKeys}
            title={title}
            close={c('Action').t`Customize calendar`}
            submit={c('Action').t`Continue`}
            onSubmit={handleStart}
            onClose={handleCustomize}
            {...rest}
        >
            <Alert>{c('Info')
                .t`Your new calendar is now ready. All events in your calendar are encrypted and inaccessible to anybody other than you or the people you invite.`}</Alert>
            <div className="w50 center">
                <img src={calendarSvg} alt={c('Alt image').t`Calendar`} />
            </div>
            <Alert>{c('Info')
                .t`If you encounter a problem, you can reach our support team by clicking the button.`}</Alert>
        </FormModal>
    );
};

WelcomeModal.propTypes = {
    addresses: PropTypes.array
};

export default WelcomeModal;

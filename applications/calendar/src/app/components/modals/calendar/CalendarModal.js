import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    FormModal,
    useUser,
    useUserKeys,
    useAddressesKeys,
    useAddresses,
    useLoading,
    useEventManager,
    useApi,
    useNotifications,
    SimpleTabs
} from 'react-components';

import { createCalendar, updateCalendar } from 'proton-shared/lib/api/calendars';
import Loader from 'react-components/components/loader/Loader';

import { setupCalendarKey } from '../../../helpers/calendarModal';
import { DEFAULT_CALENDAR } from '../../../constants';
import CalendarSettingsTab from './CalendarSettingsTab';
import EventSettingsTab from './EventSettingsTab';

const CalendarModal = ({ calendar, members = [], ...rest }) => {
    const api = useApi();
    const { call } = useEventManager();
    const [user] = useUser();
    const [userKeysList] = useUserKeys(user);
    const [addresses, loadingAddresses] = useAddresses();
    const [addressesKeysMap, loadingAddressesKeys] = useAddressesKeys(user, addresses, userKeysList);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const isEdit = !!calendar;

    const { AddressID } = isEdit
        ? {}
        : members.find(({ AddressID }) => {
              if (!addresses) {
                  return false;
              }
              return addresses.find(({ ID }) => ID === AddressID);
          }) || {};

    const title = isEdit ? c('Title').t`Update calendar` : c('Title').t`Create calendar`;

    const [model, updateModel] = useState({
        name: calendar ? calendar.Name : '',
        color: calendar ? calendar.Color : DEFAULT_CALENDAR.color,
        display: calendar ? !!calendar.Display : true,
        addressID: calendar ? AddressID : ''
    });

    const handleSubmit = async () => {
        // Calendar creation / update
        const { addressID } = model;
        const data = {
            Name: model.name,
            Color: model.color,
            Display: +model.display,
            Description: model.description
        };

        if (!calendar) {
            data.AddressID = addressID;
        }

        const { Calendar = {} } = await api(calendar ? updateCalendar(calendar.ID, data) : createCalendar(data));

        // Key setup
        if (!calendar) {
            const { Email: email = '' } = addresses.find(({ ID }) => ID === addressID);
            const addressKeys = addressesKeysMap[addressID];
            await setupCalendarKey({ api, addressID, addressKeys, calendarID: Calendar.ID, email });
        }

        await call();
        rest.onClose();
        createNotification({ text: calendar ? c('Success').t`Calendar updated` : c('Success').t`Calendar created` });
    };

    const isLoading = loading || !addresses || loadingAddresses || loadingAddressesKeys || !addressesKeysMap;
    const tabs = [
        {
            title: c('Header').t`Calendar settings`,
            content: (
                <CalendarSettingsTab
                    model={model}
                    updateModel={updateModel}
                    calendar={calendar}
                    addressesKeysMap={addressesKeysMap}
                    addresses={addresses}
                    onClose={rest.onClose}
                />
            )
        },
        { title: c('Header').t`Event settings`, content: <EventSettingsTab model={model} updateModel={updateModel} /> }
    ];

    return (
        <FormModal
            title={title}
            submit={calendar ? c('Action').t`Update` : c('Action').t`Create`}
            onSubmit={() => withLoading(handleSubmit())}
            loading={isLoading}
            {...rest}
        >
            {isLoading ? <Loader /> : <SimpleTabs tabs={tabs} />}
        </FormModal>
    );
};

CalendarModal.propTypes = {
    calendar: PropTypes.object,
    members: PropTypes.arrayOf(PropTypes.object)
};

export default CalendarModal;

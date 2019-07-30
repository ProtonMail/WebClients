import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Select,
    Toggle,
    FormModal,
    useUser,
    useAddressesKeys,
    useAddresses,
    useLoading,
    useEventManager,
    Row,
    Label,
    Field,
    Input,
    ColorPicker,
    TextArea,
    useApi,
    useNotifications
} from 'react-components';
import { getPrimaryKey } from 'proton-shared/lib/keys/keys';
import { createCalendar, updateCalendar, setupCalendar, queryMembers } from 'proton-shared/lib/api/calendars';

import { setupKey } from '../../helpers/calendarModal';
import { DEFAULT_CALENDAR_COLOR } from '../../constants';
import Loader from 'react-components/components/loader/Loader';

const CalendarModal = ({ calendar, members = [], ...rest }) => {
    const api = useApi();
    const { call } = useEventManager();
    const [user] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [addressesKeysMap, loadingAddressesKeys] = useAddressesKeys(user, addresses);
    const loadedRef = useRef();
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
        color: calendar ? calendar.Color : DEFAULT_CALENDAR_COLOR,
        display: calendar ? !!calendar.Display : true,
        addressID: calendar ? AddressID : ''
    });

    const handleSubmit = async () => {
        // Calendar creation / update
        const { addressID } = model;
        const data = {
            Name: model.name,
            Color: model.color,
            Display: +model.display
        };

        if (!calendar) {
            data.AddressID = addressID;
        }

        const { Calendar = {} } = await api(calendar ? updateCalendar(calendar.ID, data) : createCalendar(data));

        // Key setup
        if (!calendar) {
            const { Members: members = [] } = await api(queryMembers(Calendar.ID));
            const { MemberID } = members.find(({ AddressID }) => AddressID === addressID);
            const { Email: email = '' } = addresses.find(({ ID }) => ID === addressID);
            const addressKeys = addressesKeysMap[addressID];
            const { privateKey } = getPrimaryKey(addressKeys) || {};
            const memberPublicKeys = { [MemberID]: privateKey.toPublic() };
            const data = await setupKey({ memberPublicKeys, email, addressID, privateKey });
            await api(setupCalendar(Calendar.ID, data));
        }

        await call();
        rest.onClose();
        createNotification({ text: calendar ? c('Success').t`Calendar updated` : c('Success').t`Calendar created` });
    };

    const options = (addresses || [])
        .filter(({ ID }) => {
            const addressKeys = addressesKeysMap ? addressesKeysMap[ID] : [];
            const { privateKey } = getPrimaryKey(addressKeys) || {};
            return privateKey && privateKey.isDecrypted();
        })
        .map(({ ID, DisplayName = '', Email = '' }) => ({
            value: ID,
            text: [DisplayName, Email].filter(Boolean).join(' ')
        }));

    const isLoading = loading || !addresses || loadingAddresses || loadingAddressesKeys || !addressesKeysMap;

    useEffect(() => {
        if (isLoading || loadedRef.current) {
            return;
        }

        loadedRef.current = true;

        if (!options.length) {
            loadedRef.current = true;
            createNotification({ text: c('Error').t`No address available`, type: 'error' });
            rest.onClose();
            return;
        }

        if (!model.addressID) {
            updateModel({ ...model, addressID: options[0].value });
        }
    }, [isLoading, options]);

    const content = isLoading ? (
        <Loader />
    ) : (
        <>
            {calendar ? null : (
                <Row>
                    <Label htmlFor="calendar-address-select">{c('Label').t`Address`}</Label>
                    <Field>
                        <Select
                            id="calendar-address-select"
                            value={model.addressID}
                            onChange={({ target }) => updateModel({ ...model, addressID: target.value })}
                            options={options}
                        />
                    </Field>
                </Row>
            )}
            <Row>
                <Label htmlFor="calendar-name-input">{c('Label').t`Name`}</Label>
                <Field>
                    <Input
                        id="calendar-name-input"
                        value={model.name}
                        placeholder={c('Placeholder').t`Name`}
                        required
                        onChange={({ target }) => updateModel({ ...model, name: target.value })}
                    />
                </Field>
                <div className="ml1">
                    <ColorPicker color={model.color} onChange={({ hex: color }) => updateModel({ ...model, color })}>
                        &nbsp;
                    </ColorPicker>
                </div>
            </Row>
            {calendar ? (
                <Row>
                    <Label htmlFor="calendar-display-toggle">{c('Label').t`Display`}</Label>
                    <Field>
                        <Toggle
                            id="calendar-display-toggle"
                            checked={model.display}
                            onChange={({ target }) => updateModel({ ...model, display: target.checked })}
                        />
                    </Field>
                </Row>
            ) : null}
            <Row>
                <Label htmlFor="calendar-description-textarea">{c('Label').t`Description`}</Label>
                <Field>
                    <TextArea
                        id="calendar-description-textarea"
                        value={model.description}
                        placeholder={c('Placeholder').t`Description`}
                        onChange={({ target }) => updateModel({ ...model, description: target.value })}
                    />
                </Field>
            </Row>
        </>
    );

    return (
        <FormModal
            title={title}
            submit={calendar ? c('Action').t`Update` : c('Action').t`Create`}
            onSubmit={() => withLoading(handleSubmit())}
            loading={isLoading}
            {...rest}
        >
            {content}
        </FormModal>
    );
};

CalendarModal.propTypes = {
    calendar: PropTypes.object,
    members: PropTypes.arrayOf(PropTypes.object)
};

export default CalendarModal;

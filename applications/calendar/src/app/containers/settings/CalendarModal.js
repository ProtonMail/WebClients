import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    FormModal,
    useLoading,
    useEventManager,
    useApi,
    useNotifications,
    Loader,
    SimpleTabs,
    useGetCalendarBootstrap,
    useGetAddresses,
    useGetAddressKeys,
    useCache,
    GenericError
} from 'react-components';

import {
    createCalendar,
    updateCalendarSettings,
    updateCalendar,
    updateCalendarUserSettings
} from 'proton-shared/lib/api/calendars';
import getPrimaryKey from 'proton-shared/lib/keys/getPrimaryKey';

import CalendarSettingsTab from './CalendarSettingsTab';
import EventSettingsTab from './EventSettingsTab';
import { setupCalendarKeys } from '../setup/resetHelper';
import { getActiveAddresses } from 'proton-shared/lib/helpers/address';
import { noop } from 'proton-shared/lib/helpers/function';
import { loadModels } from 'proton-shared/lib/models/helper';
import { CalendarsModel } from 'proton-shared/lib/models';
import {
    getCalendarModel,
    getCalendarPayload,
    getCalendarSettingsPayload,
    getDefaultModel,
    validate
} from './calendarModalState';

const CalendarModal = ({ calendar, calendars = [], defaultCalendarID, defaultColor = false, ...rest }) => {
    const api = useApi();
    const { call } = useEventManager();
    const cache = useCache();
    const getAddresses = useGetAddresses();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddressKeys = useGetAddressKeys();
    const [loadingSetup, withLoading] = useLoading(true);
    const [loadingAction, withLoadingAction] = useLoading();
    const { createNotification } = useNotifications();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(false);

    const isEdit = !!calendar;

    const [model, setModel] = useState(() => getDefaultModel(defaultColor));

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
                addressOptions: activeAdresses.map(({ ID, Email = '' }) => ({ value: ID, text: Email }))
            }));
        };

        const initializeCalendar = async () => {
            const [{ Members, CalendarSettings }, Addresses] = await Promise.all([
                getCalendarBootstrap(calendar.ID),
                getAddresses()
            ]);

            const [{ Email: memberEmail } = {}] = Members;
            const { ID: AddressID } = Addresses.find(({ Email }) => memberEmail === Email) || {};

            if (!AddressID) {
                setError(true);
                return createNotification({ text: c('Error').t`No valid address found`, type: 'error' });
            }

            setModel((prev) => ({
                ...prev,
                ...getCalendarModel({ Calendar: calendar, CalendarSettings, Addresses, AddressID })
            }));
        };

        const promise = calendar ? initializeCalendar() : initializeEmptyCalendar();

        withLoading(
            promise.catch(() => {
                setError(true);
            })
        );
    }, []);

    const handleCreateCalendar = async (addressID, calendarPayload) => {
        const [addresses, addressKeys] = await Promise.all([getAddresses(), getAddressKeys(addressID)]);

        const { privateKey: primaryAddressKey } = getPrimaryKey(addressKeys) || {};
        if (!primaryAddressKey) {
            createNotification({ text: c('Error').t`Primary address key is not decrypted.`, type: 'error' });
            setError(true);
            throw new Error('Missing primary key');
        }

        const { Calendar = {} } = await api(
            createCalendar({
                ...calendarPayload,
                AddressID: addressID
            })
        );

        await setupCalendarKeys({
            api,
            calendars: [Calendar],
            addresses,
            getAddressKeys
        });

        // Refresh the calendar model in order to ensure flags are correct
        await loadModels([CalendarsModel], { api, cache, useCache: false });

        return Calendar.ID;
    };

    const handleUpdateCalendar = async (calendarPayload) => {
        await api(updateCalendar(calendar.ID, calendarPayload));
        return calendar.ID;
    };

    const formattedModel = {
        ...model,
        name: model.name.trim(),
        description: model.description.trim()
    };

    const errors = validate(formattedModel);

    const handleProcessCalendar = async () => {
        const calendarPayload = getCalendarPayload(formattedModel);
        const actualCalendarID = isEdit
            ? await handleUpdateCalendar(calendarPayload)
            : await handleCreateCalendar(formattedModel.addressID, calendarPayload);

        if (!defaultCalendarID && !isEdit) {
            // When creating a calendar, create a default calendar if there was none.
            const DefaultCalendarID = calendars.length ? calendars[0].ID : actualCalendarID;
            await api(updateCalendarUserSettings({ DefaultCalendarID }));
        }

        await api(updateCalendarSettings(actualCalendarID, getCalendarSettingsPayload(formattedModel)));
        await call();
    };

    const { section, ...modalProps } = (() => {
        if (error) {
            return {
                title: c('Title').t`Error`,
                submit: c('Action').t`Close`,
                hasClose: false,
                section: <GenericError />,
                onSubmit() {
                    window.location.reload();
                }
            };
        }

        const tabs = [
            {
                title: c('Header').t`Calendar settings`,
                content: (
                    <CalendarSettingsTab
                        isSubmitted={isSubmitted}
                        errors={errors}
                        model={model}
                        setModel={setModel}
                        onClose={rest.onClose}
                    />
                )
            },
            {
                title: c('Header').t`Event settings`,
                content: (
                    <EventSettingsTab isSubmitted={isSubmitted} errors={errors} model={model} setModel={setModel} />
                )
            }
        ];

        return {
            title: isEdit ? c('Title').t`Update calendar` : c('Title').t`Create calendar`,
            submit: isEdit ? c('Action').t`Update` : c('Action').t`Create`,
            close: c('Action').t`Cancel`,
            loading: loadingSetup || loadingAction,
            section: loadingSetup ? <Loader /> : <SimpleTabs tabs={tabs} />,
            hasClose: true,
            onSubmit: () => {
                setIsSubmitted(true);
                if (Object.keys(errors).length > 0) {
                    return;
                }
                withLoadingAction(handleProcessCalendar())
                    .then(() => {
                        rest.onClose();
                        createNotification({
                            text: isEdit ? c('Success').t`Calendar updated` : c('Success').t`Calendar created`
                        });
                    })
                    .catch(() => {
                        setError(true);
                    });
            }
        };
    })();

    return (
        <FormModal
            title={''}
            className="pm-modal--shorterLabels w100"
            close={null}
            onClose={noop}
            onSubmit={noop}
            submit={c('Action').t`Continue`}
            hasClose={false}
            {...modalProps}
            {...rest}
        >
            {section}
        </FormModal>
    );
};

CalendarModal.propTypes = {
    calendar: PropTypes.object,
    calendars: PropTypes.array,
    defaultCalendarID: PropTypes.oneOfType([PropTypes.string, null]),
    defaultColor: PropTypes.bool,
    members: PropTypes.arrayOf(PropTypes.object)
};

export default CalendarModal;

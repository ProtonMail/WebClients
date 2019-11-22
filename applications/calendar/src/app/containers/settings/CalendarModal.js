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
    useGetAddressKeys
} from 'react-components';

import {
    createCalendar,
    updateCalendarSettings,
    updateCalendar,
    setupCalendar,
    queryMembers
} from 'proton-shared/lib/api/calendars';
import { getPrimaryKey } from 'proton-shared/lib/keys/keys';

import { DEFAULT_CALENDAR, DEFAULT_EVENT_DURATION, NOTIFICATION_TYPE } from '../../constants';
import CalendarSettingsTab from './CalendarSettingsTab';
import EventSettingsTab from './EventSettingsTab';
import {
    notificationsToModel,
    modelToNotifications,
    DEFAULT_FULL_DAY_NOTIFICATION,
    DEFAULT_FULL_DAY_NOTIFICATIONS,
    DEFAULT_PART_DAY_NOTIFICATION,
    DEFAULT_PART_DAY_NOTIFICATIONS
} from '../../helpers/notifications';
import { generateCalendarKeyPayload, getKeysMemberMap } from 'proton-shared/lib/keys/calendarKeys';

const validate = ({ name, description }) => {
    const errors = {};

    if (!name) {
        errors.name = c('Error').t`Name required`;
    }

    if (!description) {
        errors.description = c('Error').t`Description required`;
    }

    return errors;
};

const CalendarModal = ({ calendar, ...rest }) => {
    const api = useApi();
    const { call } = useEventManager();
    const getAddresses = useGetAddresses();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddressKeys = useGetAddressKeys();
    const [loadingSetup, withLoading] = useLoading(true);
    const [loadingAction, withLoadingAction] = useLoading();
    const { createNotification } = useNotifications();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const isEdit = !!calendar;

    const title = isEdit ? c('Title').t`Update calendar` : c('Title').t`Create calendar`;

    const [model, setModel] = useState(() => ({
        name: '',
        description: '',
        color: DEFAULT_CALENDAR.color,
        display: true,
        addressOptions: [],
        duration: DEFAULT_EVENT_DURATION,
        defaultPartDayNotification: DEFAULT_PART_DAY_NOTIFICATION,
        defaultFullDayNotification: DEFAULT_FULL_DAY_NOTIFICATION,
        partDayNotifications: notificationsToModel(DEFAULT_PART_DAY_NOTIFICATIONS, false),
        fullDayNotifications: notificationsToModel(DEFAULT_FULL_DAY_NOTIFICATIONS, true)
    }));

    useEffect(() => {
        const initializeEmptyCalendar = async () => {
            const addresses = await getAddresses();

            setModel((prev) => ({
                ...prev,
                addressID: addresses[0].ID,
                addressOptions: addresses.map(({ ID, Email = '' }) => ({ value: ID, text: Email }))
            }));
        };

        const initializeCalendar = async () => {
            const [{ Members, CalendarSettings }, addresses] = await Promise.all([
                getCalendarBootstrap(calendar.ID),
                getAddresses()
            ]);

            const [{ Email: memberEmail } = {}] = Members;
            const { ID: addressID } = addresses.find(({ Email }) => memberEmail === Email) || {};

            if (!addressID) {
                rest.onClose();
                return createNotification({ text: c('Error').t`Member address not found`, type: 'error' });
            }

            const {
                DefaultPartDayNotifications = DEFAULT_PART_DAY_NOTIFICATIONS,
                DefaultFullDayNotifications = DEFAULT_FULL_DAY_NOTIFICATIONS,
                DefaultEventDuration = DEFAULT_EVENT_DURATION
            } = CalendarSettings;

            const partDayNotifications = notificationsToModel(DefaultPartDayNotifications, false);
            const fullDayNotifications = notificationsToModel(DefaultFullDayNotifications, true);

            // Filter out any email notifications because they are currently not supported.
            const devicePartDayNotifications = partDayNotifications.filter(
                ({ type }) => type === NOTIFICATION_TYPE.DEVICE
            );
            const deviceFullDayNotifications = fullDayNotifications.filter(
                ({ type }) => type === NOTIFICATION_TYPE.DEVICE
            );

            const emailPartDayNotifications = partDayNotifications.filter(
                ({ type }) => type === NOTIFICATION_TYPE.EMAIL
            );
            const emailFullDayNotifications = fullDayNotifications.filter(
                ({ type }) => type === NOTIFICATION_TYPE.EMAIL
            );

            setModel((prev) => ({
                ...prev,
                calendarID: calendar.ID,
                name: calendar.Name,
                display: calendar.Display,
                description: calendar.Description,
                color: calendar.Color,
                addressID,
                addressOptions: addresses.map(({ ID, Email = '' }) => ({ value: ID, text: Email })),
                duration: DefaultEventDuration,
                partDayNotifications: devicePartDayNotifications,
                fullDayNotifications: deviceFullDayNotifications,
                _emailPartDayNotifications: emailPartDayNotifications,
                _emailFullDayNotifications: emailFullDayNotifications
            }));
        };

        const promise = calendar ? initializeCalendar() : initializeEmptyCalendar();

        withLoading(
            promise.catch(() => {
                // Just close if it failed to load.
                rest.onClose();
            })
        );
    }, []);

    const handleCreateCalendar = async (addressID, calendarPayload) => {
        const [addresses, addressKeys] = await Promise.all([getAddresses(), getAddressKeys(addressID)]);

        const { Email: primaryAddressEmail = '' } = addresses.find(({ ID }) => ID === addressID) || {};
        const { privateKey: primaryAddressKey, publicKey: primaryAddressPublicKey } = getPrimaryKey(addressKeys) || {};
        if (!primaryAddressKey || !primaryAddressKey.isDecrypted()) {
            createNotification({ text: c('Error').t`Primary address key is not decrypted.`, type: 'error' });
            return;
        }

        const { Calendar = {} } = await api(
            createCalendar({
                ...calendarPayload,
                AddressID: addressID
            })
        );
        const { Members = [] } = await api(queryMembers(Calendar.ID));

        const calendarKeyPayload = await generateCalendarKeyPayload({
            addressID,
            calendarID: Calendar.ID,
            privateKey: primaryAddressKey,
            memberPublicKeys: getKeysMemberMap(Members, {
                [primaryAddressEmail]: primaryAddressPublicKey
            })
        });

        await api(setupCalendar(Calendar.ID, calendarKeyPayload));

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

    const handleSubmit = async () => {
        setIsSubmitted(true);
        if (Object.keys(errors).length > 0) {
            return;
        }

        const calendarPayload = {
            Name: formattedModel.name,
            Color: formattedModel.color,
            Display: +formattedModel.display,
            Description: formattedModel.description
        };

        const actualCalendarID = calendar
            ? await handleUpdateCalendar(calendarPayload)
            : await handleCreateCalendar(formattedModel.addressID, calendarPayload);

        const {
            duration,
            fullDayNotifications,
            partDayNotifications,
            _emailPartDayNotifications = [],
            _emailFullDayNotifications = []
        } = formattedModel;

        const calendarSettingsData = {
            DefaultEventDuration: +duration,
            DefaultFullDayNotifications: modelToNotifications(fullDayNotifications.concat(_emailFullDayNotifications)),
            DefaultPartDayNotifications: modelToNotifications(partDayNotifications.concat(_emailPartDayNotifications))
        };

        await api(updateCalendarSettings(actualCalendarID, calendarSettingsData));
        await call();

        rest.onClose();
        createNotification({
            text: calendar ? c('Success').t`Calendar updated` : c('Success').t`Calendar created`
        });
    };

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
            content: <EventSettingsTab isSubmitted={isSubmitted} errors={errors} model={model} setModel={setModel} />
        }
    ];

    return (
        <FormModal
            className="pm-modal--shorterLabels w100"
            title={title}
            submit={calendar ? c('Action').t`Update` : c('Action').t`Create`}
            onSubmit={() => withLoadingAction(handleSubmit())}
            loading={loadingSetup || loadingAction}
            {...rest}
        >
            {loadingSetup ? <Loader /> : <SimpleTabs tabs={tabs} />}
        </FormModal>
    );
};

CalendarModal.propTypes = {
    calendar: PropTypes.object,
    members: PropTypes.arrayOf(PropTypes.object)
};

export default CalendarModal;

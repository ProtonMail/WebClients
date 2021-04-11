import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import {
    createCalendar,
    updateCalendarSettings,
    updateCalendar,
    updateCalendarUserSettings,
    CalendarCreateData,
} from 'proton-shared/lib/api/calendars';
import { getPrimaryKey } from 'proton-shared/lib/keys';

import { getActiveAddresses } from 'proton-shared/lib/helpers/address';
import { noop } from 'proton-shared/lib/helpers/function';
import { loadModels } from 'proton-shared/lib/models/helper';
import { CalendarsModel } from 'proton-shared/lib/models';
import { Calendar, CalendarSettings } from 'proton-shared/lib/interfaces/calendar';
import { dedupeNotifications, sortNotificationsByAscendingTrigger } from 'proton-shared/lib/calendar/alarms';

import { FormModal, Loader, Tabs } from '../../../components';
import {
    getCalendarModel,
    getCalendarPayload,
    getCalendarSettingsPayload,
    getDefaultModel,
    validate,
} from './calendarModalState';
import EventSettingsTab from './EventSettingsTab';
import CalendarSettingsTab from './CalendarSettingsTab';
import { setupCalendarKey } from '../../keys/calendar';
import {
    useApi,
    useCache,
    useEventManager,
    useGetAddresses,
    useGetAddressKeys,
    useGetCalendarBootstrap,
    useLoading,
    useNotifications,
} from '../../../hooks';
import { useCalendarModelEventManager } from '../../eventManager';
import { GenericError } from '../../error';

interface Props {
    calendar?: Calendar;
    activeCalendars?: Calendar[];
    defaultCalendarID?: string;
    defaultColor?: boolean;
    onClose?: () => void;
}

export const CalendarModal = ({
    calendar: initialCalendar,
    activeCalendars = [],
    defaultCalendarID = '',
    defaultColor = false,
    ...rest
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { call: calendarCall } = useCalendarModelEventManager();
    const cache = useCache();
    const getAddresses = useGetAddresses();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddressKeys = useGetAddressKeys();
    const [loadingSetup, withLoading] = useLoading(true);
    const [loadingAction, withLoadingAction] = useLoading();
    const { createNotification } = useNotifications();

    const [tab, setTab] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(false);
    const [calendar, setCalendar] = useState(initialCalendar);
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
                ...getCalendarModel({ Calendar: initialCalendar, CalendarSettings, Addresses, AddressID }),
            }));
        };

        const promise = initialCalendar ? initializeCalendar() : initializeEmptyCalendar();

        withLoading(
            promise.catch(() => {
                setError(true);
            })
        );
    }, []);

    const handleCreateCalendar = async (
        addressID: string,
        calendarPayload: CalendarCreateData,
        calendarSettingsPayload: Partial<CalendarSettings>
    ) => {
        const [addresses, addressKeys] = await Promise.all([getAddresses(), getAddressKeys(addressID)]);

        const { privateKey: primaryAddressKey } = getPrimaryKey(addressKeys) || {};
        if (!primaryAddressKey) {
            createNotification({ text: c('Error').t`Primary address key is not decrypted.`, type: 'error' });
            setError(true);
            throw new Error('Missing primary key');
        }

        const {
            Calendar,
            Calendar: { ID: newCalendarID },
        } = await api<{ Calendar: Calendar }>(
            createCalendar({
                ...calendarPayload,
                AddressID: addressID,
            })
        );

        await setupCalendarKey({
            api,
            calendarID: newCalendarID,
            addresses,
            getAddressKeys,
        }).catch((e: Error) => {
            // Hard failure if the keys fail to setup. Force the user to reload.
            setError(true);
            throw e;
        });

        // Set the calendar in case one of the following calls fails so that it ends up in the update function after this.
        setCalendar(Calendar);

        await Promise.all([
            api(updateCalendarSettings(newCalendarID, calendarSettingsPayload)),
            (() => {
                if (defaultCalendarID) {
                    return;
                }
                const newDefaultCalendarID = activeCalendars.length ? activeCalendars[0].ID : newCalendarID;
                return api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID }));
            })(),
        ]);

        // Refresh the calendar model in order to ensure flags are correct
        await loadModels([CalendarsModel], { api, cache, useCache: false });
        await call();

        rest.onClose?.();

        createNotification({ text: c('Success').t`Calendar created` });
    };

    const handleUpdateCalendar = async (
        calendar: Calendar,
        calendarPayload: Partial<Calendar>,
        calendarSettingsPayload: Partial<CalendarSettings>
    ) => {
        const calendarID = calendar.ID;
        await Promise.all([
            api(updateCalendar(calendarID, calendarPayload)),
            api(updateCalendarSettings(calendarID, calendarSettingsPayload)),
        ]);
        // Case: Calendar has been created, and keys have been setup, but one of the calendar settings call failed in the creation.
        // Here we are in create -> edit mode. So we have to fetch the calendar model again.
        if (!initialCalendar) {
            await loadModels([CalendarsModel], { api, cache, useCache: false });
        }
        await call();
        await calendarCall([calendarID]);

        rest.onClose?.();

        createNotification({ text: c('Success').t`Calendar updated` });
    };

    const formattedModel = {
        ...model,
        name: model.name.trim(),
        description: model.description.trim(),
    };

    const errors = validate(formattedModel);

    const handleProcessCalendar = async () => {
        const formattedModelWithFormattedNotifications = {
            ...formattedModel,
            partDayNotifications: sortNotificationsByAscendingTrigger(dedupeNotifications(model.partDayNotifications)),
            fullDayNotifications: sortNotificationsByAscendingTrigger(dedupeNotifications(model.fullDayNotifications)),
        };
        const calendarPayload = getCalendarPayload(formattedModelWithFormattedNotifications);
        const calendarSettingsPayload = getCalendarSettingsPayload(formattedModelWithFormattedNotifications);
        if (calendar) {
            return handleUpdateCalendar(calendar, calendarPayload, calendarSettingsPayload);
        }
        return handleCreateCalendar(
            formattedModelWithFormattedNotifications.addressID,
            calendarPayload,
            calendarSettingsPayload
        );
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
                },
            };
        }

        const tabs = [
            {
                title: c('Header').t`Calendar settings`,
                content: (
                    <CalendarSettingsTab isSubmitted={isSubmitted} errors={errors} model={model} setModel={setModel} />
                ),
            },
            {
                title: c('Header').t`Event settings`,
                content: <EventSettingsTab model={model} setModel={setModel} />,
            },
        ];

        const isEdit = !!initialCalendar;
        return {
            title: isEdit ? c('Title').t`Update calendar` : c('Title').t`Create calendar`,
            submit: isEdit ? c('Action').t`Update` : c('Action').t`Create`,
            close: c('Action').t`Cancel`,
            loading: loadingSetup || loadingAction,
            section: loadingSetup ? <Loader /> : <Tabs value={tab} onChange={setTab} tabs={tabs} />,
            hasClose: true,
            onSubmit: () => {
                setIsSubmitted(true);
                if (Object.keys(errors).length > 0) {
                    return;
                }
                withLoadingAction(handleProcessCalendar());
            },
        };
    })();

    return (
        <FormModal className="modal--shorter-labels w100" close={null} onClose={noop} {...modalProps} {...rest}>
            {section}
        </FormModal>
    );
};

export default CalendarModal;

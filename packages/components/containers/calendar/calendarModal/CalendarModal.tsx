import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { c } from 'ttag';

import {
    createCalendar,
    updateCalendarSettings,
    updateCalendar,
    updateCalendarUserSettings,
} from 'proton-shared/lib/api/calendars';
import { CalendarCreateData } from 'proton-shared/lib/interfaces/calendar/Api';
import { getPrimaryKey } from 'proton-shared/lib/keys';

import { getActiveAddresses } from 'proton-shared/lib/helpers/address';
import { noop } from 'proton-shared/lib/helpers/function';
import { loadModels } from 'proton-shared/lib/models/helper';
import { CalendarsModel } from 'proton-shared/lib/models';
import { Calendar, CalendarSettings } from 'proton-shared/lib/interfaces/calendar';
import { dedupeNotifications, sortNotificationsByAscendingTrigger } from 'proton-shared/lib/calendar/alarms';

import { MAX_DEFAULT_NOTIFICATIONS, MAX_LENGTHS } from 'proton-shared/lib/calendar/constants';
import {
    ColorPicker,
    Field,
    FormModal,
    Input,
    Label,
    Loader,
    Option,
    Row,
    SelectTwo,
    TextArea,
    Toggle,
} from '../../../components';
import {
    getCalendarModel,
    getCalendarPayload,
    getCalendarSettingsPayload,
    getDefaultModel,
    validate,
} from './calendarModalState';
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
import Notifications from '../notifications/Notifications';

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

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(false);
    const [calendar, setCalendar] = useState(initialCalendar);
    const [model, setModel] = useState(() => getDefaultModel(defaultColor));

    const addressText = useMemo(() => {
        const option = model.addressOptions.find(({ value: ID }) => ID === model.addressID);
        return (option && option.text) || '';
    }, [model.addressID, model.addressOptions]);

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

        const isEdit = !!initialCalendar;
        return {
            title: isEdit ? c('Title').t`Update calendar` : c('Title').t`Create calendar`,
            submit: isEdit ? c('Action').t`Update` : c('Action').t`Create`,
            close: c('Action').t`Cancel`,
            loading: loadingSetup || loadingAction,
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
            {loadingSetup ? (
                <Loader />
            ) : (
                <>
                    <Row>
                        <Label htmlFor="calendar-name-input">{c('Label').t`Name`}</Label>
                        <Field>
                            <Input
                                id="calendar-name-input"
                                value={model.name}
                                error={errors.name}
                                maxLength={MAX_LENGTHS.CALENDAR_NAME}
                                isSubmitted={isSubmitted}
                                placeholder={c('Placeholder').t`Add a calendar name`}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    setModel({ ...model, name: target.value })
                                }
                                autoFocus
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="calendar-color">{c('Label').t`Choose a color`}</Label>
                        <Field>
                            <ColorPicker
                                id="calendar-color"
                                color={model.color}
                                onChange={(color) => setModel({ ...model, color })}
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="calendar-address-select">{c('Label').t`Default email`}</Label>
                        <Field className="flex flex-align-items-center">
                            {model.calendarID ? (
                                addressText
                            ) : (
                                <SelectTwo
                                    id="calendar-address-select"
                                    value={model.addressID}
                                    onChange={({ value }) => setModel({ ...model, addressID: value })}
                                >
                                    {model.addressOptions.map(({ value, text }) => (
                                        <Option key={value} value={value} title={text} />
                                    ))}
                                </SelectTwo>
                            )}
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="calendar-display-toggle">{c('Label').t`Display`}</Label>
                        <Field>
                            <Toggle
                                id="calendar-display-toggle"
                                checked={model.display}
                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                    setModel({ ...model, display: target.checked })
                                }
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="calendar-description-textarea">{c('Label').t`Description`}</Label>
                        <Field>
                            <TextArea
                                autoGrow
                                id="calendar-description-textarea"
                                value={model.description}
                                placeholder={c('Placeholder').t`Add a calendar description`}
                                onChange={({ target }: ChangeEvent<HTMLTextAreaElement>) =>
                                    setModel({ ...model, description: target.value })
                                }
                                maxLength={MAX_LENGTHS.CALENDAR_DESCRIPTION}
                                error={errors.description}
                                isSubmitted={isSubmitted}
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="duration-select">{c('Label').t`Default event duration`}</Label>
                        <Field>
                            <SelectTwo
                                id="duration-select"
                                data-test-id="create-calendar/event-settings:event-duration"
                                value={model.duration}
                                onChange={({ value }) => setModel({ ...model, duration: +value })}
                            >
                                {[
                                    { text: c('Duration').t`30 minutes`, value: 30 },
                                    { text: c('Duration').t`60 minutes`, value: 60 },
                                    { text: c('Duration').t`90 minutes`, value: 90 },
                                    { text: c('Duration').t`120 minutes`, value: 120 },
                                ].map(({ value, text }) => (
                                    <Option key={value} value={value} title={text} />
                                ))}
                            </SelectTwo>
                        </Field>
                    </Row>
                    <Row>
                        <Label>{c('Label').t`Default notifications`}</Label>
                        <div
                            data-test-id="create-calendar/event-settings:default-notification"
                            className="flex-item-fluid"
                        >
                            <Notifications
                                notifications={model.partDayNotifications}
                                canAdd={model.partDayNotifications.length < MAX_DEFAULT_NOTIFICATIONS}
                                defaultNotification={model.defaultPartDayNotification}
                                onChange={(notifications) => {
                                    setModel({
                                        ...model,
                                        partDayNotifications: notifications,
                                    });
                                }}
                            />
                        </div>
                    </Row>
                    <Row>
                        <Label>{c('Label').t`Default full day notifications`}</Label>
                        <div
                            data-test-id="create-calendar/event-settings:default-full-day-notification"
                            className="flex-item-fluid"
                        >
                            <Notifications
                                notifications={model.fullDayNotifications}
                                canAdd={model.fullDayNotifications.length < MAX_DEFAULT_NOTIFICATIONS}
                                defaultNotification={model.defaultFullDayNotification}
                                onChange={(notifications) => {
                                    setModel({
                                        ...model,
                                        fullDayNotifications: notifications,
                                    });
                                }}
                            />
                        </div>
                    </Row>
                </>
            )}
        </FormModal>
    );
};

export default CalendarModal;

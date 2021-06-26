import { getIsSubscribedCalendar } from 'proton-shared/lib/calendar/subscribe/helpers';
import React, { useState, useMemo, ChangeEvent } from 'react';
import { c } from 'ttag';

import { noop } from 'proton-shared/lib/helpers/function';
import { Calendar, SubscribedCalendar } from 'proton-shared/lib/interfaces/calendar';
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
import { getCalendarPayload, getCalendarSettingsPayload, getDefaultModel, validate } from './calendarModalState';
import { useLoading } from '../../../hooks';
import { GenericError } from '../../error';
import Notifications from '../notifications/Notifications';
import useGetCalendarSetup from '../hooks/useGetCalendarSetup';
import useGetCalendarActions from '../hooks/useGetCalendarActions';
import { TruncatedText } from '../../../components/truncatedText';

const URL_MAX_DISPLAY_LENGTH = 100;

interface Props {
    calendar?: Calendar | SubscribedCalendar;
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
    const [loadingAction, withLoadingAction] = useLoading();

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(false);
    const [calendar, setCalendar] = useState(initialCalendar);
    const [model, setModel] = useState(() => getDefaultModel(defaultColor));

    const addressText = useMemo(() => {
        const option = model.addressOptions.find(({ value: ID }) => ID === model.addressID);
        return (option && option.text) || '';
    }, [model.addressID, model.addressOptions]);

    const isSubscribedCalendar = initialCalendar && getIsSubscribedCalendar(initialCalendar);
    const subscribeURL =
        initialCalendar && getIsSubscribedCalendar(initialCalendar)
            ? initialCalendar.SubscriptionParameters.URL
            : undefined;

    const { error: setupError, loading: loadingSetup } = useGetCalendarSetup({ calendar: initialCalendar, setModel });
    const { handleCreateCalendar, handleUpdateCalendar } = useGetCalendarActions({
        calendar: initialCalendar,
        setCalendar,
        setError,
        defaultCalendarID,
        onClose: rest?.onClose,
        activeCalendars,
    });

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
        if (error || setupError) {
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
                void withLoadingAction(handleProcessCalendar());
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
                    {!isSubscribedCalendar && (
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
                    )}
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
                    {!isSubscribedCalendar && (
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
                    )}
                    {subscribeURL && (
                        <>
                            <Row>
                                <Label>{c('Label').t`URL`}</Label>
                                <span style={{ wordBreak: 'break-all' }}>
                                    <TruncatedText maxChars={URL_MAX_DISPLAY_LENGTH}>{subscribeURL}</TruncatedText>
                                </span>
                            </Row>
                        </>
                    )}

                    {!isSubscribedCalendar && (
                        <>
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
                </>
            )}
        </FormModal>
    );
};

export default CalendarModal;

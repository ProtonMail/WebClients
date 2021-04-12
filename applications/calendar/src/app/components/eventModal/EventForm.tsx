import {
    FREQUENCY,
    MAX_LENGTHS,
    MAX_NOTIFICATIONS,
    SETTINGS_NOTIFICATION_TYPE,
} from 'proton-shared/lib/calendar/constants';
import { getIsProtonUID } from 'proton-shared/lib/calendar/helper';
import { APPS } from 'proton-shared/lib/constants';
import { WeekStartsOn } from 'proton-shared/lib/date-fns-utc/interface';
import { Address } from 'proton-shared/lib/interfaces';

import { EventModel, EventModelErrors, NotificationModel } from 'proton-shared/lib/interfaces/calendar';
import React, { HTMLAttributes } from 'react';
import { Alert, AppLink, classnames, Input, Notifications, TextArea } from 'react-components';
import { c } from 'ttag';

import {
    CALENDAR_INPUT_ID,
    DESCRIPTION_INPUT_ID,
    FREQUENCY_INPUT_ID,
    LOCATION_INPUT_ID,
    NOTIFICATION_INPUT_ID,
    PARTICIPANTS_INPUT_ID,
    TITLE_INPUT_ID,
} from './const';
import createHandlers from './eventForm/createPropFactory';
import IconRow from './IconRow';
import CalendarSelect from './inputs/CalendarSelect';
import CustomFrequencySelector from './inputs/CustomFrequencySelector';
import FrequencyInput from './inputs/FrequencyInput';
import ParticipantsInput from './inputs/ParticipantsInput';

import DateTimeRow from './rows/DateTimeRow';
import MiniDateTimeRows from './rows/MiniDateTimeRows';

interface Props {
    isSubmitted: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    addresses: Address[];
    errors: EventModelErrors;
    model: EventModel;
    setModel: (value: EventModel) => void;
    tzid?: string;
    isMinimal?: boolean;
    isCreateEvent: boolean;
    setParticipantError?: (value: boolean) => void;
    textareaMaxHeight?: number;
}

const EventForm = ({
    isSubmitted,
    displayWeekNumbers,
    weekStartsOn,
    addresses,
    errors,
    model,
    setModel,
    tzid,
    isMinimal,
    isCreateEvent,
    setParticipantError,
    textareaMaxHeight,
    ...props
}: Props & HTMLAttributes<HTMLDivElement>) => {
    const {
        uid,
        frequencyModel,
        start,
        isAllDay,
        isOrganizer,
        fullDayNotifications,
        defaultFullDayNotification,
        partDayNotifications,
        defaultPartDayNotification,
        calendars,
        selfAddress,
    } = model;
    const isSingleEdit = !!model.rest?.['recurrence-id'];

    const isImportedEvent = uid && !getIsProtonUID(uid);
    const isCustomFrequencySet = frequencyModel.type === FREQUENCY.CUSTOM;
    const showParticipants = !isImportedEvent;
    const canEditSharedEventData = isOrganizer && selfAddress?.Status !== 0;
    const canChangeCalendar = isOrganizer ? !model.organizer : !isSingleEdit;
    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    const canAddNotifications = notifications.length < MAX_NOTIFICATIONS;
    const showNotifications =
        canAddNotifications || notifications.some(({ type }) => type === SETTINGS_NOTIFICATION_TYPE.DEVICE);
    const isOrganizerDisabled = isOrganizer && selfAddress?.Status === 0;

    const dateRow = isMinimal ? (
        <MiniDateTimeRows
            model={model}
            setModel={setModel}
            endError={errors.end}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
        />
    ) : (
        <DateTimeRow
            model={model}
            setModel={setModel}
            endError={errors.end}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            tzid={tzid!}
        />
    );
    const titleRow = canEditSharedEventData ? (
        <IconRow id={TITLE_INPUT_ID} title={c('Label').t`Event title`}>
            <Input
                id={TITLE_INPUT_ID}
                placeholder={c('Placeholder').t`Add title`}
                title={c('Title').t`Add event title`}
                autoFocus
                maxLength={MAX_LENGTHS.TITLE}
                {...createHandlers({ model, setModel, field: 'title' }).native}
            />
        </IconRow>
    ) : null;
    const organizerDisabledAlert = isOrganizerDisabled ? (
        <Alert type="warning">
            <span className="mr0-25">{c('Info')
                .t`You can only modify personal event properties as your organizer email address is disabled. To modify other event properties,`}</span>
            <span>
                <AppLink to="/settings/addresses" toApp={APPS.PROTONMAIL}>
                    {c('Link').t`enable your email address.`}
                </AppLink>
            </span>
        </Alert>
    ) : null;

    return (
        <div className="mt0-5" {...props}>
            {organizerDisabledAlert}
            {titleRow}
            {canEditSharedEventData && dateRow}
            {!isMinimal && canEditSharedEventData && (
                <IconRow icon="reload" title={c('Label').t`Event frequency`} id={FREQUENCY_INPUT_ID}>
                    <FrequencyInput
                        className={classnames([isCustomFrequencySet && 'mb0-5', 'w100'])}
                        id={FREQUENCY_INPUT_ID}
                        data-test-id="event-modal/frequency:select"
                        value={frequencyModel.type}
                        onChange={(type) =>
                            setModel({
                                ...model,
                                frequencyModel: { ...frequencyModel, type },
                                hasTouchedRrule: true,
                            })
                        }
                        title={c('Title').t`Select event frequency`}
                    />
                    {isCustomFrequencySet && (
                        <CustomFrequencySelector
                            frequencyModel={frequencyModel}
                            start={start}
                            displayWeekNumbers={displayWeekNumbers}
                            weekStartsOn={weekStartsOn}
                            errors={errors}
                            isSubmitted={isSubmitted}
                            onChange={(frequencyModel) => setModel({ ...model, frequencyModel, hasTouchedRrule: true })}
                        />
                    )}
                </IconRow>
            )}
            {!isMinimal && canEditSharedEventData && showParticipants && (
                <IconRow icon="contacts-groups" title={c('Label').t`Participants`} id={PARTICIPANTS_INPUT_ID}>
                    <ParticipantsInput
                        placeholder={c('Placeholder').t`Add participants`}
                        id={PARTICIPANTS_INPUT_ID}
                        model={model}
                        addresses={addresses}
                        setParticipantError={setParticipantError}
                        {...createHandlers({ model, setModel, field: 'attendees' }).model}
                    />
                </IconRow>
            )}
            {canEditSharedEventData && (
                <IconRow icon="address" title={c('Label').t`Event location`} id={LOCATION_INPUT_ID}>
                    <Input
                        id={LOCATION_INPUT_ID}
                        placeholder={c('Placeholder').t`Add location`}
                        maxLength={MAX_LENGTHS.LOCATION}
                        title={c('Title').t`Add event location`}
                        {...createHandlers({ model, setModel, field: 'location' }).native}
                    />
                </IconRow>
            )}
            {!isMinimal && showNotifications && (
                <IconRow
                    id={NOTIFICATION_INPUT_ID}
                    icon="notifications-enabled"
                    title={c('Label').t`Event notifications`}
                >
                    {isAllDay ? (
                        <Notifications
                            {...{
                                errors,
                                canAdd: canAddNotifications,
                                notifications: fullDayNotifications,
                                defaultNotification: defaultFullDayNotification,
                                onChange: (notifications: NotificationModel[]) => {
                                    setModel({
                                        ...model,
                                        fullDayNotifications: notifications,
                                        hasTouchedNotifications: {
                                            ...model.hasTouchedNotifications,
                                            fullDay: true,
                                        },
                                    });
                                },
                            }}
                        />
                    ) : (
                        <Notifications
                            {...{
                                errors,
                                canAdd: canAddNotifications,
                                notifications: partDayNotifications,
                                defaultNotification: defaultPartDayNotification,
                                onChange: (notifications: NotificationModel[]) => {
                                    setModel({
                                        ...model,
                                        partDayNotifications: notifications,
                                        hasTouchedNotifications: {
                                            ...model.hasTouchedNotifications,
                                            partDay: true,
                                        },
                                    });
                                },
                            }}
                        />
                    )}
                </IconRow>
            )}
            {calendars.length > 0 ? (
                <IconRow
                    icon="calendar"
                    title={c('Label').t`Your calendars`}
                    id={CALENDAR_INPUT_ID}
                    className="flex-item-fluid relative"
                >
                    <CalendarSelect
                        withIcon={false}
                        id={CALENDAR_INPUT_ID}
                        className="w100"
                        title={c('Title').t`Select which calendar to add this event to`}
                        frozen={!canChangeCalendar}
                        model={model}
                        setModel={setModel}
                        isCreateEvent={isCreateEvent}
                    />
                </IconRow>
            ) : null}
            {canEditSharedEventData && (
                <IconRow icon="text-align-left" title={c('Label').t`Description`} id={DESCRIPTION_INPUT_ID}>
                    <TextArea
                        id={DESCRIPTION_INPUT_ID}
                        minRows={2}
                        autoGrow
                        placeholder={c('Placeholder').t`Add description`}
                        maxLength={MAX_LENGTHS.EVENT_DESCRIPTION}
                        style={{ maxHeight: textareaMaxHeight }}
                        title={c('Title').t`Add more information related to this event`}
                        {...createHandlers({ model, setModel, field: 'description' }).native}
                    />
                </IconRow>
            )}
        </div>
    );
};

export default EventForm;

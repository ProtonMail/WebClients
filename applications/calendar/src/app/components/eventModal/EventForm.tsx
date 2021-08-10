import { c } from 'ttag';
import {
    FREQUENCY,
    MAX_LENGTHS,
    MAX_NOTIFICATIONS,
    CALENDAR_INPUT_ID,
    DESCRIPTION_INPUT_ID,
    FREQUENCY_INPUT_ID,
    LOCATION_INPUT_ID,
    NOTIFICATION_INPUT_ID,
    PARTICIPANTS_INPUT_ID,
    TITLE_INPUT_ID,
} from '@proton/shared/lib/calendar/constants';
import { getIsProtonUID } from '@proton/shared/lib/calendar/helper';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { Address } from '@proton/shared/lib/interfaces';

import { EventModel, EventModelErrors, NotificationModel } from '@proton/shared/lib/interfaces/calendar';
import { HTMLAttributes, useRef } from 'react';
import { Alert, classnames, FeatureCode, Input, Notifications, TextArea, useFeature } from '@proton/components';
import { isEmailNotification } from '@proton/shared/lib/calendar/alarms';

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
    isSubscribedCalendar?: boolean;
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
    isSubscribedCalendar,
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
    // selfAddress may not need be defined
    const isSelfAddressActive = selfAddress ? getIsAddressActive(selfAddress) : true;
    const canEditSharedEventData = !isSubscribedCalendar && isOrganizer && isSelfAddressActive;
    const canChangeCalendar = isOrganizer ? !model.organizer : !isSingleEdit;
    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    const canAddNotifications = notifications.length < MAX_NOTIFICATIONS;
    const showNotifications = canAddNotifications || notifications.length;
    const isOrganizerDisabled = !isSubscribedCalendar && isOrganizer && !isSelfAddressActive;
    // email notification editing needs to be possible for events that initially have them
    // and since the model is updated onChange, the ref makes sure it is possible even if you
    // delete the only email notification
    const emailNotificationsEnabled = useRef(
        !!useFeature(FeatureCode.CalendarEmailNotification)?.feature?.Value || notifications.some(isEmailNotification)
    ).current;

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

    const titleRow = (
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
    );

    const frequencyRow = (
        <IconRow icon="arrows-rotate" title={c('Label').t`Event frequency`} id={FREQUENCY_INPUT_ID}>
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
    );

    const locationRow = (
        <IconRow icon="address" title={c('Label').t`Event location`} id={LOCATION_INPUT_ID}>
            <Input
                id={LOCATION_INPUT_ID}
                placeholder={c('Placeholder').t`Add location`}
                maxLength={MAX_LENGTHS.LOCATION}
                title={c('Title').t`Add event location`}
                {...createHandlers({ model, setModel, field: 'location' }).native}
            />
        </IconRow>
    );

    const descriptionRow = (
        <IconRow icon="align-left" title={c('Label').t`Description`} id={DESCRIPTION_INPUT_ID}>
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
    );

    const notificationsRow = (
        <IconRow id={NOTIFICATION_INPUT_ID} icon="bell" title={c('Label').t`Event notifications`}>
            {isAllDay ? (
                <Notifications
                    hasType={emailNotificationsEnabled}
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
                    hasType={emailNotificationsEnabled}
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
    );

    const participantsRow = (
        <IconRow icon="user-group" title={c('Label').t`Participants`} id={PARTICIPANTS_INPUT_ID}>
            <ParticipantsInput
                placeholder={c('Placeholder').t`Add participants`}
                id={PARTICIPANTS_INPUT_ID}
                model={model}
                addresses={addresses}
                setParticipantError={setParticipantError}
                {...createHandlers({ model, setModel, field: 'attendees' }).model}
            />
        </IconRow>
    );

    const calendarRow = (
        <IconRow
            icon="calendar-days"
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
    );

    const organizerDisabledAlert = isOrganizerDisabled ? (
        <Alert type="warning">
            <span className="mr0-25">
                {c('Info')
                    .t`You can only modify personal event properties as you can't send emails from the organizer address.`}
            </span>
        </Alert>
    ) : null;

    return (
        <div className="mt0-5" {...props}>
            {organizerDisabledAlert}
            {canEditSharedEventData && titleRow}
            {canEditSharedEventData && dateRow}
            {!isMinimal && canEditSharedEventData && frequencyRow}
            {!isMinimal && canEditSharedEventData && showParticipants && participantsRow}
            {canEditSharedEventData && locationRow}
            {!isMinimal && showNotifications && notificationsRow}
            {!isSubscribedCalendar && calendars.length > 0 && calendarRow}
            {canEditSharedEventData && descriptionRow}
        </div>
    );
};

export default EventForm;

import { c } from 'ttag';
import {
    FREQUENCY,
    MAX_LENGTHS_API,
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
import { HTMLAttributes } from 'react';
import { Alert, classnames, Input, Notifications, TextArea, MemoizedIconRow as IconRow } from '@proton/components';

import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import createHandlers from './eventForm/createPropFactory';
import CreateEventCalendarSelect from './inputs/CreateEventCalendarSelect';
import CustomFrequencySelector from './inputs/CustomFrequencySelector';
import FrequencyInput from './inputs/FrequencyInput';
import ParticipantsInput from './inputs/ParticipantsInput';

import DateTimeRow from './rows/DateTimeRow';
import MiniDateTimeRows from './rows/MiniDateTimeRows';

export interface EventFormProps {
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
    isDuplicating?: boolean;
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
    isDuplicating = false,
    ...props
}: EventFormProps & HTMLAttributes<HTMLDivElement>) => {
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
    // selfAddress may not need be defined
    const isSelfAddressActive = selfAddress ? getIsAddressActive(selfAddress) : true;
    const canEditSharedEventData = !isSubscribedCalendar && isOrganizer && isSelfAddressActive;
    const showParticipants = !isImportedEvent && (!isMinimal || isCreateEvent) && canEditSharedEventData;
    const canChangeCalendar = isOrganizer ? !model.organizer : !isSingleEdit;
    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    const canAddNotifications = notifications.length < MAX_NOTIFICATIONS;
    const showNotifications = canAddNotifications || notifications.length;
    const isOrganizerDisabled = !isSubscribedCalendar && isOrganizer && !isSelfAddressActive;

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
                maxLength={MAX_LENGTHS_API.TITLE}
                {...createHandlers({ model, setModel, field: 'title' }).native}
            />
        </IconRow>
    );

    const frequencyRow = (
        <IconRow icon="arrows-rotate" title={c('Label').t`Frequency`} id={FREQUENCY_INPUT_ID}>
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
        <IconRow icon="map-marker" title={c('Label').t`Location`} id={LOCATION_INPUT_ID}>
            <Input
                id={LOCATION_INPUT_ID}
                placeholder={c('Placeholder').t`Add location`}
                maxLength={MAX_LENGTHS_API.LOCATION}
                title={c('Title').t`Add event location`}
                {...createHandlers({ model, setModel, field: 'location' }).native}
            />
        </IconRow>
    );

    const descriptionRow = (
        <IconRow
            icon="align-left"
            iconClassName="on-rtl-mirror"
            title={c('Label').t`Description`}
            id={DESCRIPTION_INPUT_ID}
        >
            <TextArea
                id={DESCRIPTION_INPUT_ID}
                minRows={2}
                autoGrow
                placeholder={c('Placeholder').t`Add description`}
                maxLength={MAX_LENGTHS_API.EVENT_DESCRIPTION}
                style={{ '--max-height-custom': `${textareaMaxHeight}px` }}
                className="max-h-custom"
                title={c('Title').t`Add more information related to this event`}
                {...createHandlers({ model, setModel, field: 'description' }).native}
            />
        </IconRow>
    );

    const notificationsRow = (
        <IconRow id={NOTIFICATION_INPUT_ID} icon="bell" title={c('Label').t`Notifications`}>
            {isAllDay ? (
                <Notifications
                    hasType
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
                    hasType
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
                collapsible={!isMinimal}
                setParticipantError={setParticipantError}
                {...createHandlers({ model, setModel, field: 'attendees' }).model}
            />
        </IconRow>
    );

    const getCalendarIcon = () => {
        if (calendars.length === 1) {
            return <CalendarSelectIcon className="mt0-25" color={calendars[0].color} />;
        }

        if (!canChangeCalendar) {
            return <CalendarSelectIcon className="mt0-25" color={model.calendar.color} />;
        }

        return 'calendar-days';
    };

    const calendarRow = (
        <IconRow
            icon={getCalendarIcon()}
            title={c('Label').t`Calendar`}
            id={CALENDAR_INPUT_ID}
            className="flex-item-fluid relative"
        >
            <CreateEventCalendarSelect
                id={CALENDAR_INPUT_ID}
                className="w100"
                title={c('Title').t`Select which calendar to add this event to`}
                frozen={!canChangeCalendar}
                model={model}
                setModel={setModel}
                isCreateEvent={isCreateEvent}
                isDuplicating={isDuplicating}
            />
        </IconRow>
    );

    const organizerDisabledAlert = isOrganizerDisabled ? (
        <Alert className="mb1" type="warning">
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
            {showParticipants && participantsRow}
            {canEditSharedEventData && locationRow}
            {!isMinimal && showNotifications && notificationsRow}
            {!isSubscribedCalendar && calendars.length > 0 && calendarRow}
            {canEditSharedEventData && descriptionRow}
        </div>
    );
};

export default EventForm;

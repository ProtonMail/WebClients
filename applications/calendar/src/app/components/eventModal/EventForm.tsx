import { HTMLAttributes, useRef } from 'react';

import { c } from 'ttag';

import { MemoizedIconRow as IconRow, InputTwo, Notifications, TextAreaTwo, classnames } from '@proton/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import NotificationsInDrawer from '@proton/components/containers/calendar/notifications/NotificationsInDrawer';
import {
    CALENDAR_INPUT_ID,
    DESCRIPTION_INPUT_ID,
    FREQUENCY,
    FREQUENCY_INPUT_ID,
    LOCATION_INPUT_ID,
    MAX_LENGTHS_API,
    MAX_NOTIFICATIONS,
    NOTIFICATION_INPUT_ID,
    PARTICIPANTS_INPUT_ID,
    TITLE_INPUT_ID,
} from '@proton/shared/lib/calendar/constants';
import { getIsProtonUID } from '@proton/shared/lib/calendar/helper';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { Address } from '@proton/shared/lib/interfaces';
import { AttendeeModel, EventModel, EventModelErrors, NotificationModel } from '@proton/shared/lib/interfaces/calendar';

import createHandlers from './eventForm/createPropFactory';
import { getOrganizerAndSelfAddressModel } from './eventForm/state';
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
    canEditSharedEventData?: boolean;
    isMinimal?: boolean;
    isCreateEvent: boolean;
    setParticipantError?: (value: boolean) => void;
    isDuplicating?: boolean;
    isDrawerApp?: boolean;
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
    canEditSharedEventData = true,
    isCreateEvent,
    setParticipantError,
    isDuplicating = false,
    isDrawerApp,
    ...props
}: EventFormProps & HTMLAttributes<HTMLDivElement>) => {
    const isOrganizerOfInvitationRef = useRef(!isCreateEvent && !!model.organizer);
    const isOrganizerOfInvitation = isOrganizerOfInvitationRef.current;

    const {
        uid,
        frequencyModel,
        start,
        isAllDay,
        isAttendee,
        fullDayNotifications,
        defaultFullDayNotification,
        partDayNotifications,
        defaultPartDayNotification,
        calendars,
        calendar: { isSubscribed: isSubscribedCalendar },
    } = model;
    const isSingleEdit = !!model.rest?.['recurrence-id'];

    const isImportedEvent = uid && !getIsProtonUID(uid);
    const isCustomFrequencySet = frequencyModel.type === FREQUENCY.CUSTOM;
    const canChangeCalendar = isAttendee ? !isSingleEdit : !isOrganizerOfInvitation;
    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    const canAddNotifications = notifications.length < MAX_NOTIFICATIONS;
    const showNotifications = canAddNotifications || notifications.length;

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
            <InputTwo
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
        <IconRow icon="map-pin" title={c('Label').t`Location`} id={LOCATION_INPUT_ID}>
            <InputTwo
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
            icon="text-align-left"
            iconClassName="on-rtl-mirror"
            title={c('Label').t`Description`}
            id={DESCRIPTION_INPUT_ID}
        >
            <TextAreaTwo
                id={DESCRIPTION_INPUT_ID}
                minRows={2}
                autoGrow
                placeholder={c('Placeholder').t`Add description`}
                maxLength={MAX_LENGTHS_API.EVENT_DESCRIPTION}
                className="max-h-custom"
                title={c('Title').t`Add more information related to this event`}
                {...createHandlers({ model, setModel, field: 'description' }).native}
            />
        </IconRow>
    );

    // temporary code; remove when proper design available
    const allDayNotificationsRow = isDrawerApp ? (
        <NotificationsInDrawer
            id={NOTIFICATION_INPUT_ID}
            hasType
            {...{
                errors,
                canAdd: canAddNotifications,
                notifications: fullDayNotifications,
                defaultNotification: defaultFullDayNotification,
                onChange: (notifications: NotificationModel[]) => {
                    setModel({
                        ...model,
                        hasDefaultNotifications: false,
                        fullDayNotifications: notifications,
                        hasFullDayDefaultNotifications: false,
                    });
                },
            }}
        />
    ) : (
        <Notifications
            id={NOTIFICATION_INPUT_ID}
            hasType
            {...{
                errors,
                canAdd: canAddNotifications,
                notifications: fullDayNotifications,
                defaultNotification: defaultFullDayNotification,
                onChange: (notifications: NotificationModel[]) => {
                    setModel({
                        ...model,
                        hasDefaultNotifications: false,
                        fullDayNotifications: notifications,
                        hasFullDayDefaultNotifications: false,
                    });
                },
            }}
        />
    );
    const partDayNotificationsRow = isDrawerApp ? (
        <NotificationsInDrawer
            id={NOTIFICATION_INPUT_ID}
            hasType
            {...{
                errors,
                canAdd: canAddNotifications,
                notifications: partDayNotifications,
                defaultNotification: defaultPartDayNotification,
                onChange: (notifications: NotificationModel[]) => {
                    setModel({
                        ...model,
                        hasDefaultNotifications: false,
                        partDayNotifications: notifications,
                        hasPartDayDefaultNotifications: false,
                    });
                },
            }}
        />
    ) : (
        <Notifications
            id={NOTIFICATION_INPUT_ID}
            hasType
            {...{
                errors,
                canAdd: canAddNotifications,
                notifications: partDayNotifications,
                defaultNotification: defaultPartDayNotification,
                onChange: (notifications: NotificationModel[]) => {
                    setModel({
                        ...model,
                        hasDefaultNotifications: false,
                        partDayNotifications: notifications,
                        hasPartDayDefaultNotifications: false,
                    });
                },
            }}
        />
    );

    const notificationsRow = (
        <IconRow
            id={NOTIFICATION_INPUT_ID}
            icon="bell"
            title={c('Label').t`Notifications`}
            labelClassName={isDrawerApp ? '' : 'pb0-5 on-mobile-mt0-5'}
        >
            {isAllDay ? allDayNotificationsRow : partDayNotificationsRow}
        </IconRow>
    );

    const handleChangeAttendees = (value: AttendeeModel[]) => {
        const { organizer: newOrganizer, selfAddress: newSelfAddress } = getOrganizerAndSelfAddressModel({
            attendees: value,
            addressID: model.member.addressID,
            addresses,
        });

        setModel({
            ...model,
            attendees: value,
            isOrganizer: !!value.length,
            organizer: isOrganizerOfInvitation ? model.organizer : newOrganizer,
            selfAddress: isOrganizerOfInvitation ? model.selfAddress : newSelfAddress,
        });
    };

    const participantsRow = (
        <IconRow icon="users" title={c('Label').t`Participants`} id={PARTICIPANTS_INPUT_ID}>
            <ParticipantsInput
                placeholder={c('Placeholder').t`Add participants`}
                id={PARTICIPANTS_INPUT_ID}
                value={model.attendees}
                onChange={handleChangeAttendees}
                organizer={model.organizer}
                addresses={addresses}
                collapsible={!isMinimal}
                setParticipantError={setParticipantError}
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

        return 'calendar-grid';
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

    return (
        <div className="mt0-5" {...props}>
            {canEditSharedEventData && titleRow}
            {canEditSharedEventData && dateRow}
            {canEditSharedEventData && !isMinimal && frequencyRow}
            {canEditSharedEventData && !isImportedEvent && participantsRow}
            {canEditSharedEventData && locationRow}
            {!isMinimal && showNotifications && notificationsRow}
            {!isSubscribedCalendar && calendars.length > 0 && calendarRow}
            {canEditSharedEventData && descriptionRow}
        </div>
    );
};

export default EventForm;

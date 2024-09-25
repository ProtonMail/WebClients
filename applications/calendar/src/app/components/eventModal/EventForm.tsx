import type { HTMLAttributes } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms';
import {
    MemoizedIconRow as IconRow,
    Notifications,
    NotificationsInDrawer,
    TextAreaTwo,
    useModalStateObject,
} from '@proton/components';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import {
    CALENDAR_INPUT_ID,
    DESCRIPTION_INPUT_ID,
    FREQUENCY,
    FREQUENCY_INPUT_ID,
    LOCATION_INPUT_ID,
    MAX_CHARS_API,
    MAX_NOTIFICATIONS,
    NOTIFICATION_INPUT_ID,
    PARTICIPANTS_INPUT_ID,
    TITLE_INPUT_ID,
} from '@proton/shared/lib/calendar/constants';
import { getIsProtonUID } from '@proton/shared/lib/calendar/helper';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import type { Address } from '@proton/shared/lib/interfaces';
import type {
    AttendeeModel,
    EventModel,
    EventModelErrors,
    FrequencyModel,
    NotificationModel,
} from '@proton/shared/lib/interfaces/calendar';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { getCanChangeCalendarOfEvent } from '../../helpers/event';
import BusySlotsSpotlight from './BusySlotsSpotlight';
import createHandlers from './eventForm/createPropFactory';
import { getOrganizerAndSelfAddressModel } from './eventForm/state';
import CreateEventCalendarSelect from './inputs/CreateEventCalendarSelect';
import CustomFrequencyModal from './inputs/CustomFrequencyModal';
import CustomFrequencySelector from './inputs/CustomFrequencySelector';
import EventColorSelect from './inputs/EventColorSelect';
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
    isInvitation: boolean;
    setParticipantError?: (value: boolean) => void;
    isOwnedCalendar?: boolean;
    isCalendarWritable?: boolean;
    isDrawerApp?: boolean;
    isSmallViewport: boolean;
    onDisplayBusySlots?: () => void;
    view: VIEWS;
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
    isInvitation,
    setParticipantError,
    isOwnedCalendar = true,
    isCalendarWritable = true,
    isDrawerApp,
    isSmallViewport,
    onDisplayBusySlots,
    view,
    ...props
}: EventFormProps & HTMLAttributes<HTMLDivElement>) => {
    const isColorPerEventEnabled = useFlag('ColorPerEventWeb');

    const isOrganizerOfInvitationRef = useRef(!isCreateEvent && !!model.isOrganizer);
    const isOrganizerOfInvitation = isOrganizerOfInvitationRef.current;

    const {
        uid,
        frequencyModel,
        start,
        isAllDay,
        isAttendee,
        isOrganizer,
        fullDayNotifications,
        defaultFullDayNotification,
        partDayNotifications,
        defaultPartDayNotification,
        calendars,
    } = model;
    const isSingleEdit = !!model.rest?.['recurrence-id'];

    const isImportedEvent = uid && !getIsProtonUID(uid);
    const isCustomFrequencySet = frequencyModel.type === FREQUENCY.CUSTOM;
    const canChangeCalendar = getCanChangeCalendarOfEvent({
        isCreateEvent,
        isOwnedCalendar,
        isCalendarWritable,
        isSingleEdit,
        isInvitation,
        isAttendee,
        isOrganizer,
    });
    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    const canAddNotifications = notifications.length < MAX_NOTIFICATIONS;
    const showNotifications = canAddNotifications || notifications.length;

    const customModal = useModalStateObject();
    const previousFrequencyRef = useRef<FrequencyModel>();

    const dateRow = isMinimal ? (
        <MiniDateTimeRows
            model={model}
            setModel={setModel}
            endError={errors.end}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
        >
            <div className="color-weak hover:color-norm">
                <FrequencyInput
                    className="w-full relative inline-flex flex-nowrap gap-1 text-left sm:text-right items-center rounded"
                    id={FREQUENCY_INPUT_ID}
                    frequencyInputType="dropdown"
                    data-testid="event-modal/frequency:select"
                    value={frequencyModel.type}
                    onChange={(type) => {
                        if (type === FREQUENCY.CUSTOM) {
                            customModal.openModal(true);
                            previousFrequencyRef.current = frequencyModel;
                        }
                        setModel({
                            ...model,
                            frequencyModel: { ...frequencyModel, type },
                            hasTouchedRrule: true,
                        });
                    }}
                    title={c('Title').t`Select event frequency`}
                />
            </div>

            {customModal.render && (
                <CustomFrequencyModal
                    modalProps={{
                        ...customModal.modalProps,
                        onClose: () => {
                            customModal.modalProps.onClose();
                            const frequencyModel = previousFrequencyRef.current;
                            if (frequencyModel) {
                                setModel({ ...model, frequencyModel: frequencyModel });
                            }
                        },
                    }}
                    frequencyModel={frequencyModel}
                    start={start}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    errors={errors}
                    isSubmitted={isSubmitted}
                    onChange={(frequencyModel) => {
                        setModel({ ...model, frequencyModel, hasTouchedRrule: true });
                        customModal.modalProps.onClose();
                    }}
                />
            )}
        </MiniDateTimeRows>
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
        <IconRow icon="text-title" id={TITLE_INPUT_ID} title={c('Label').t`Event title`}>
            <Input
                id={TITLE_INPUT_ID}
                placeholder={c('Placeholder').t`Add title`}
                title={c('Title').t`Add event title`}
                autoFocus
                maxLength={MAX_CHARS_API.TITLE}
                {...createHandlers({ model, setModel, field: 'title' }).native}
            />
        </IconRow>
    );

    const frequencyRow = (
        <IconRow icon="arrows-rotate" title={c('Label').t`Frequency`} id={FREQUENCY_INPUT_ID}>
            <FrequencyInput
                className={clsx([isCustomFrequencySet && 'mb-2', 'w-full'])}
                id={FREQUENCY_INPUT_ID}
                data-testid="event-modal/frequency:select"
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
            <Input
                id={LOCATION_INPUT_ID}
                placeholder={c('Placeholder').t`Add location`}
                maxLength={MAX_CHARS_API.LOCATION}
                title={c('Title').t`Add event location`}
                {...createHandlers({ model, setModel, field: 'location' }).native}
            />
        </IconRow>
    );

    const descriptionRow = (
        <IconRow
            icon="text-align-left"
            iconClassName="rtl:mirror"
            title={c('Label').t`Description`}
            id={DESCRIPTION_INPUT_ID}
        >
            <TextAreaTwo
                id={DESCRIPTION_INPUT_ID}
                minRows={2}
                autoGrow
                placeholder={c('Placeholder').t`Add description`}
                maxLength={MAX_CHARS_API.EVENT_DESCRIPTION}
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
            labelClassName={isDrawerApp ? '' : 'pb-2 mt-2 md:mt-0'}
        >
            {isAllDay ? allDayNotificationsRow : partDayNotificationsRow}
        </IconRow>
    );

    const handleChangeAttendees = (value: AttendeeModel[]) => {
        const { organizer: newOrganizer, selfAddress: newSelfAddress } = getOrganizerAndSelfAddressModel({
            attendees: value,
            addressID: model.member.addressID,
            addresses,
            isAttendee: false,
        });

        setModel({
            ...model,
            attendees: value,
            isOrganizer: isOrganizerOfInvitation ? true : !!value.length,
            organizer: isOrganizerOfInvitation ? model.organizer : newOrganizer,
            selfAddress: isOrganizerOfInvitation ? model.selfAddress : newSelfAddress,
        });
    };

    const participantsRow = (
        <BusySlotsSpotlight view={view} isDisplayedInPopover={!!isMinimal}>
            <IconRow icon="users" title={c('Label').t`Participants`} id={PARTICIPANTS_INPUT_ID}>
                <ParticipantsInput
                    placeholder={c('Placeholder').t`Add participants`}
                    id={PARTICIPANTS_INPUT_ID}
                    value={model.attendees}
                    isOwnedCalendar={model.calendar.isOwned}
                    onChange={handleChangeAttendees}
                    organizer={model.organizer}
                    addresses={addresses}
                    collapsible={!isMinimal}
                    setParticipantError={setParticipantError}
                    onDisplayBusySlots={onDisplayBusySlots}
                    displayBusySlots={!!isMinimal}
                    view={view}
                />
            </IconRow>
        </BusySlotsSpotlight>
    );

    const getCalendarIcon = () => {
        if (isColorPerEventEnabled) {
            return 'calendar-grid';
        }
        if (calendars.length === 1) {
            return <CalendarSelectIcon className="mt-1" color={calendars[0].color} />;
        }

        if (!canChangeCalendar) {
            return <CalendarSelectIcon className="mt-1" color={model.calendar.color} />;
        }

        return 'calendar-grid';
    };

    const calendarRow = (
        <IconRow
            icon={getCalendarIcon()}
            title={c('Label').t`Calendar`}
            id={CALENDAR_INPUT_ID}
            className="flex flex-nowrap flex-1 grow"
            containerClassName={clsx(isMinimal && !isColorPerEventEnabled && 'eventpopover-calendar-select')}
        >
            <CreateEventCalendarSelect
                id={CALENDAR_INPUT_ID}
                className="w-full flex-1"
                title={c('Title').t`Select which calendar to add this event to`}
                frozen={!canChangeCalendar}
                model={model}
                setModel={setModel}
                isCreateEvent={isCreateEvent}
                isColorPerEventEnabled={isColorPerEventEnabled}
            />
            {isColorPerEventEnabled && (
                <EventColorSelect
                    model={model}
                    setModel={setModel}
                    isSmallViewport={isSmallViewport}
                    isDrawerApp={isDrawerApp}
                />
            )}
        </IconRow>
    );

    return (
        <div className="mt-2" {...props}>
            {canEditSharedEventData && titleRow}
            {canEditSharedEventData && dateRow}
            {canEditSharedEventData && !isMinimal && frequencyRow}
            {calendars.length > 0 && calendarRow}
            {canEditSharedEventData && !isImportedEvent && participantsRow}
            {canEditSharedEventData && locationRow}
            {!isMinimal && showNotifications && notificationsRow}
            {canEditSharedEventData && descriptionRow}
        </div>
    );
};

export default EventForm;

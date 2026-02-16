import type { HTMLAttributes } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';
import IconRow from '@proton/components/components/iconRow/MemoizedIconRow';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import Notifications from '@proton/components/containers/calendar/notifications/Notifications';
import NotificationsInDrawer from '@proton/components/containers/calendar/notifications/NotificationsInDrawer';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import {
    CALENDAR_INPUT_ID,
    FREQUENCY,
    FREQUENCY_INPUT_ID,
    MAX_NOTIFICATIONS,
    NOTIFICATION_INPUT_ID,
} from '@proton/shared/lib/calendar/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import type { Address } from '@proton/shared/lib/interfaces';
import type { EventModel, EventModelErrors, NotificationModel } from '@proton/shared/lib/interfaces/calendar';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { getCanChangeCalendarOfEvent } from '../../helpers/event';
import CreateEventCalendarSelect from './inputs/CreateEventCalendarSelect';
import CustomFrequencyModal from './inputs/CustomFrequencyModal';
import EventColorSelect from './inputs/EventColorSelect';
import FrequencyInput from './inputs/FrequencyInput';
import { DateTimeRow } from './rows/DateTimeRow';
import { MiniDateTimeRows } from './rows/MiniDateTimeRows';
import { RowDescription } from './rows/RowDescription';
import { RowLocation } from './rows/RowLocation';
import { RowParticipants } from './rows/RowParticipants';
import { RowTitle } from './rows/RowTitle';
import { RowVideoConference } from './rows/RowVideoConference';

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
    onDisplayBusySlots?: () => void;
    view: VIEWS;
    hasZoomError: boolean;
    setIsVideoConferenceLoading: (value: boolean) => void;
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
    canEditSharedEventData = true,
    isCreateEvent,
    isInvitation,
    setParticipantError,
    isOwnedCalendar = true,
    isCalendarWritable = true,
    isDrawerApp,
    onDisplayBusySlots,
    view,
    hasZoomError,
    setIsVideoConferenceLoading,
    isDuplicating,
    ...props
}: EventFormProps & HTMLAttributes<HTMLDivElement>) => {
    const isColorPerEventEnabled = useFlag('ColorPerEventWeb');

    const [mailSettings] = useMailSettings();
    const eventFormContentRef = useRef<HTMLDivElement>(null);
    const { modal: linkModal } = useLinkHandler(eventFormContentRef, mailSettings);

    const isSingleEdit = !!model.rest?.['recurrence-id'];

    const canChangeCalendar = getCanChangeCalendarOfEvent({
        isCreateEvent,
        isOwnedCalendar,
        isCalendarWritable,
        isSingleEdit,
        isInvitation,
        isAttendee: model.isAttendee,
        isOrganizer: model.isOrganizer,
    });
    const notifications = model.isAllDay ? model.fullDayNotifications : model.partDayNotifications;
    const canAddNotifications = notifications.length < MAX_NOTIFICATIONS;
    const showNotifications = canAddNotifications || notifications.length;

    const customModal = useModalStateObject();

    const frequencyDropdown = (
        <>
            <div>
                <FrequencyInput
                    className="w-full relative flex flex-nowrap gap-1 text-left items-center rounded"
                    id={FREQUENCY_INPUT_ID}
                    data-testid="event-modal/frequency:select"
                    start={model.start}
                    weekStartsOn={weekStartsOn}
                    frequencyModel={model.frequencyModel}
                    onChange={(frequencyModel) => {
                        if (frequencyModel.type === FREQUENCY.CUSTOM) {
                            customModal.openModal(true);
                        } else {
                            setModel({
                                ...model,
                                frequencyModel: frequencyModel,
                                hasTouchedRrule: true,
                            });
                        }
                    }}
                />
            </div>

            {customModal.render && (
                <CustomFrequencyModal
                    modalProps={customModal.modalProps}
                    frequencyModel={model.frequencyModel}
                    start={model.start}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    errors={errors}
                    view={view}
                    isSubmitted={isSubmitted}
                    onChange={(frequencyModel) => {
                        setModel({ ...model, frequencyModel, hasTouchedRrule: true });
                        customModal.modalProps.onClose();
                    }}
                />
            )}
        </>
    );

    const dateRow = isMinimal ? (
        <MiniDateTimeRows
            model={model}
            setModel={setModel}
            endError={errors.end}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
        >
            {frequencyDropdown}
        </MiniDateTimeRows>
    ) : (
        <DateTimeRow
            model={model}
            setModel={setModel}
            endError={errors.end}
            displayWeekNumbers={displayWeekNumbers}
            weekStartsOn={weekStartsOn}
            tzid={tzid!}
        >
            {canEditSharedEventData && !isMinimal && frequencyDropdown}
        </DateTimeRow>
    );

    // temporary code; remove when proper design available
    const allDayNotificationsRow = isDrawerApp ? (
        <NotificationsInDrawer
            id={NOTIFICATION_INPUT_ID}
            hasType
            {...{
                errors,
                canAdd: canAddNotifications,
                notifications: model.fullDayNotifications,
                defaultNotification: model.defaultFullDayNotification,
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
                notifications: model.fullDayNotifications,
                defaultNotification: model.defaultFullDayNotification,
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
                notifications: model.partDayNotifications,
                defaultNotification: model.defaultPartDayNotification,
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
                notifications: model.partDayNotifications,
                defaultNotification: model.defaultPartDayNotification,
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
            {model.isAllDay ? allDayNotificationsRow : partDayNotificationsRow}
        </IconRow>
    );

    const getCalendarIcon = () => {
        if (isColorPerEventEnabled) {
            return 'calendar-grid';
        }
        if (model.calendars.length === 1) {
            return <CalendarSelectIcon className="mt-1" color={model.calendars[0].color} />;
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
            {isColorPerEventEnabled && <EventColorSelect model={model} setModel={setModel} />}
        </IconRow>
    );

    return (
        <div className="mt-2" {...props} ref={eventFormContentRef}>
            <RowTitle canEditSharedEventData={canEditSharedEventData} model={model} setModel={setModel} />
            {canEditSharedEventData && dateRow}
            {model.calendars.length > 0 && calendarRow}
            <RowParticipants
                canEditSharedEventData={canEditSharedEventData}
                isCreateEvent={isCreateEvent}
                model={model}
                setModel={setModel}
                setParticipantError={setParticipantError}
                addresses={addresses}
                isMinimal={isMinimal}
                onDisplayBusySlots={onDisplayBusySlots}
                view={view}
            />
            <RowLocation canEditSharedEventData={canEditSharedEventData} model={model} setModel={setModel} />
            {canEditSharedEventData && (
                <RowVideoConference
                    model={model}
                    setModel={setModel}
                    isCreateEvent={isCreateEvent}
                    hasZoomError={hasZoomError}
                    setIsVideoConferenceLoading={setIsVideoConferenceLoading}
                    isDuplicating={isDuplicating}
                />
            )}
            {!isMinimal && showNotifications && notificationsRow}
            <RowDescription canEditSharedEventData={canEditSharedEventData} model={model} setModel={setModel} />
            {linkModal}
        </div>
    );
};

export default EventForm;

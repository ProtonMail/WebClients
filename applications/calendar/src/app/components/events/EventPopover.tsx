import { useEffect, useMemo, useRef } from 'react';

import { getUnixTime } from 'date-fns';
import { c } from 'ttag';

import {
    Alert,
    AppLink,
    Badge,
    ButtonLike,
    CalendarInviteButtons,
    FeatureCode,
    Icon,
    Loader,
    Tooltip,
    useCalendarBootstrap,
    useFeature,
    useLoading,
} from '@proton/components';
import CalendarEventDateHeader from '@proton/components/components/calendarEventDateHeader/CalendarEventDateHeader';
import { getIsCalendarDisabled, getIsCalendarWritable } from '@proton/shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS, VIEWS } from '@proton/shared/lib/calendar/constants';
import { getLinkToCalendarEvent } from '@proton/shared/lib/calendar/helper';
import { getTimezonedFrequencyString } from '@proton/shared/lib/calendar/integration/getFrequencyString';
import { notificationsToModel } from '@proton/shared/lib/calendar/notificationsToModel';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { fromUTCDate, toLocalDate } from '@proton/shared/lib/date/timezone';
import { wait } from '@proton/shared/lib/helpers/promise';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Calendar, CalendarBootstrap, CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import noop from '@proton/utils/noop';

import { getIsCalendarEvent } from '../../containers/calendar/eventStore/cache/helper';
import {
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
    DisplayNameEmail,
} from '../../containers/calendar/interface';
import { getIsSideApp } from '../../helpers/views';
import { INVITE_ACTION_TYPES, InviteActions } from '../../interfaces/Invite';
import PopoverContainer from './PopoverContainer';
import PopoverEventContent from './PopoverEventContent';
import PopoverFooter from './PopoverFooter';
import PopoverHeader from './PopoverHeader';
import { getEventErrorMessage } from './error';
import getEventInformation from './getEventInformation';
import useReadEvent from './useReadEvent';

const { ACCEPTED, TENTATIVE } = ICAL_ATTENDEE_STATUS;

interface Props {
    formatTime: (date: Date) => string;
    onEdit: (event: CalendarEvent, calendarData: Calendar) => void;
    onDuplicate?: (event: CalendarEvent, calendarData: Calendar) => void;
    onChangePartstat: (partstat: ICAL_ATTENDEE_STATUS) => Promise<void>;
    onDelete: (inviteActions: InviteActions) => Promise<void>;
    onClose: () => void;
    style: any;
    popoverRef: any;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    view: VIEWS;
    tzid: string;
    weekStartsOn: WeekStartsOn;
    isNarrow: boolean;
    displayNameEmailMap: SimpleMap<DisplayNameEmail>;
}

const EventPopover = ({
    formatTime,
    onEdit,
    onDuplicate,
    onChangePartstat,
    onDelete,
    onClose,
    style,
    popoverRef,
    event: targetEvent,
    event: { start, end, isAllDay, isAllPartDay },
    view,
    tzid,
    weekStartsOn,
    isNarrow,
    displayNameEmailMap,
}: Props) => {
    const popoverEventContentRef = useRef<HTMLDivElement>(null);

    const [loadingAction, withLoadingAction] = useLoading();

    const targetEventData = targetEvent?.data || {};
    const { eventReadResult, eventData, calendarData } = targetEventData;

    const recurrenceDate = toLocalDate(fromUTCDate(start));
    const recurrenceTimestamp = getUnixTime(recurrenceDate);
    const linkTo =
        eventData &&
        getLinkToCalendarEvent({
            calendarID: eventData.CalendarID,
            eventID: eventData.ID,
            recurrenceID: recurrenceTimestamp,
        });

    const isCalendarDisabled = getIsCalendarDisabled(calendarData);
    const isSubscribedCalendar = getIsSubscribedCalendar(calendarData);
    const [calendarBootstrap]: [CalendarBootstrap, boolean, any] = useCalendarBootstrap(calendarData.ID);
    const isSubscribedCalendarReminderFeatureEnabled = !!useFeature(FeatureCode.SubscribedCalendarReminder).feature
        ?.Value;
    const isCalendarWritable = getIsCalendarWritable(calendarData);

    const model = useReadEvent(eventReadResult?.result, tzid);
    const { eventReadError, isEventReadLoading, eventTitleSafe, isCancelled, userPartstat, isSelfAddressActive } =
        getEventInformation(targetEvent, model);

    useEffect(() => {
        if (
            !isSubscribedCalendar ||
            !isSubscribedCalendarReminderFeatureEnabled ||
            !calendarBootstrap ||
            isEventReadLoading
        ) {
            return;
        }

        const {
            CalendarSettings: { DefaultFullDayNotifications, DefaultPartDayNotifications },
        } = calendarBootstrap;

        model.notifications = notificationsToModel(
            model.isAllDay ? DefaultFullDayNotifications : DefaultPartDayNotifications,
            model.isAllDay
        );
    }, [
        isEventReadLoading,
        calendarBootstrap,
        isSubscribedCalendar,
        isSubscribedCalendarReminderFeatureEnabled,
        model,
    ]);

    const handleDelete = () => {
        if (eventData && getIsCalendarEvent(eventData)) {
            const sendCancellationNotice =
                !eventReadError && !isCalendarDisabled && !isCancelled && [ACCEPTED, TENTATIVE].includes(userPartstat);
            const inviteActions = model.isAttendee
                ? {
                      type: isSelfAddressActive
                          ? INVITE_ACTION_TYPES.DECLINE_INVITATION
                          : INVITE_ACTION_TYPES.DECLINE_DISABLED,
                      isProtonProtonInvite: !!eventData.IsProtonProtonInvite,
                      sendCancellationNotice,
                      selfAddress: model.selfAddress,
                      selfAttendeeIndex: model.selfAttendeeIndex,
                      partstat: ICAL_ATTENDEE_STATUS.DECLINED,
                  }
                : {
                      type: isSelfAddressActive
                          ? INVITE_ACTION_TYPES.CANCEL_INVITATION
                          : INVITE_ACTION_TYPES.CANCEL_DISABLED,
                      isProtonProtonInvite: !!eventData.IsProtonProtonInvite,
                      selfAddress: model.selfAddress,
                      selfAttendeeIndex: model.selfAttendeeIndex,
                  };
            withLoadingAction(onDelete(inviteActions)).catch(noop);
        }
    };

    const handleEdit = () => {
        if (eventData && getIsCalendarEvent(eventData)) {
            onEdit(eventData, calendarData);
        }
    };

    const handleDuplicate = () => {
        if (eventData && getIsCalendarEvent(eventData)) {
            onDuplicate?.(eventData, calendarData);
        }
    };

    const dateHeader = useMemo(
        () => (
            <CalendarEventDateHeader
                startDate={start}
                endDate={end}
                isAllDay={isAllDay && !isAllPartDay}
                formatTime={formatTime}
                hasFakeUtcDates
                hasModifiedAllDayEndDate
                className="text-lg m0"
            />
        ),
        [start, end, isAllDay, isAllPartDay, formatTime]
    );

    const editButton = isCalendarWritable && !isCalendarDisabled && (
        <Tooltip title={c('Event edit button tooltip').t`Edit event`}>
            <ButtonLike
                data-test-id="event-popover:edit"
                shape="ghost"
                onClick={handleEdit}
                disabled={loadingAction}
                icon
                size="small"
            >
                <Icon name="pen" alt={c('Event edit button tooltip').t`Edit event`} />
            </ButtonLike>
        </Tooltip>
    );
    const deleteButton = isCalendarWritable && (
        <Tooltip title={c('Event delete button tooltip').t`Delete event`}>
            <ButtonLike
                data-test-id="event-popover:delete"
                shape="ghost"
                onClick={loadingAction ? noop : handleDelete}
                loading={loadingAction}
                icon
                size="small"
            >
                <Icon name="trash" alt={c('Event delete button tooltip').t`Delete event`} />
            </ButtonLike>
        </Tooltip>
    );
    const duplicateButton = !isSubscribedCalendar && !model.isAttendee && !!onDuplicate && (
        <Tooltip title={c('Event duplicate button tooltip').t`Duplicate event`}>
            <ButtonLike
                data-test-id="event-popover:duplicate"
                shape="ghost"
                onClick={handleDuplicate}
                disabled={loadingAction}
                icon
                size="small"
            >
                <Icon name="squares" alt={c('Event duplicate button tooltip').t`Duplicate event`} />
            </ButtonLike>
        </Tooltip>
    );

    const viewEventButton = getIsSideApp(view) && (
        <Tooltip title={c('View event button tooltip').t`Open in a new tab`}>
            <AppLink
                to={linkTo || '/'}
                selfOpening
                className="mr0-5 button button-small button-ghost-weak button-for-icon"
            >
                <Icon name="arrow-out-square" size={14} />
            </AppLink>
        </Tooltip>
    );

    const actions = {
        accept: () => onChangePartstat(ICAL_ATTENDEE_STATUS.ACCEPTED),
        acceptTentatively: () => onChangePartstat(ICAL_ATTENDEE_STATUS.TENTATIVE),
        decline: () => onChangePartstat(ICAL_ATTENDEE_STATUS.DECLINED),
        retryCreateEvent: () => wait(0),
        retryUpdateEvent: () => wait(0),
    };

    const containerClassName = 'eventpopover flex flex-column flex-nowrap';
    const mergedStyle = isNarrow ? undefined : style;
    const frequencyString = useMemo(() => {
        const [{ veventComponent: eventComponent }] = eventReadResult?.result || [{}];
        if (!eventComponent) {
            return;
        }
        return getTimezonedFrequencyString(eventComponent.rrule, eventComponent.dtstart, {
            currentTzid: tzid,
            weekStartsOn,
            locale: dateLocale,
        });
    }, [eventReadResult, tzid]);

    const commonContainerProps = {
        style: mergedStyle,
        ref: popoverRef,
        onClose,
    };
    const commonHeaderProps = {
        onClose,
        className: 'flex-item-noshrink',
    };

    if (eventReadError) {
        return (
            <PopoverContainer {...commonContainerProps} className={containerClassName}>
                <PopoverHeader
                    {...commonHeaderProps}
                    actions={deleteButton && <div className="flex flex-nowrap flex-justify-end">{deleteButton}</div>}
                >
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <Alert className="mb1" type="error">
                    {getEventErrorMessage(eventReadError)}
                </Alert>
            </PopoverContainer>
        );
    }

    if (isEventReadLoading) {
        return (
            <PopoverContainer {...commonContainerProps} className="eventpopover p1">
                <Loader />
            </PopoverContainer>
        );
    }

    const hasPopoverButtons = editButton || duplicateButton || deleteButton || viewEventButton;

    return (
        <PopoverContainer {...commonContainerProps} className={containerClassName}>
            <PopoverHeader
                {...commonHeaderProps}
                actions={
                    hasPopoverButtons && (
                        <>
                            {editButton}
                            {duplicateButton}
                            {deleteButton}
                            {viewEventButton}
                        </>
                    )
                }
            >
                {isCancelled && (
                    <Badge
                        type="light"
                        tooltip={c('Calendar invite info').t`This event has been canceled`}
                        className="mb0-4"
                    >
                        <span className="text-uppercase">{c('Event canceled status badge').t`canceled`}</span>
                    </Badge>
                )}
                <h1 className="eventpopover-title lh-rg text-hyphens scroll-if-needed mb0-25" title={eventTitleSafe}>
                    {eventTitleSafe}
                </h1>
                <div className="mb1">
                    {dateHeader}
                    {!!frequencyString && <div className="color-weak">{frequencyString}</div>}
                </div>
            </PopoverHeader>
            <div className="scroll-if-needed mb1" ref={popoverEventContentRef}>
                <PopoverEventContent
                    key={targetEvent.id}
                    calendar={calendarData}
                    model={model}
                    formatTime={formatTime}
                    displayNameEmailMap={displayNameEmailMap}
                    popoverEventContentRef={popoverEventContentRef}
                />
            </div>
            {isCalendarWritable && model.isAttendee && !isCancelled && (
                <PopoverFooter
                    className="flex-align-items-center flex-justify-space-between on-mobile-flex-justify-start flex-gap-1"
                    key={targetEvent.id}
                >
                    <strong>{c('Calendar invite buttons label').t`Attending?`}</strong>
                    <CalendarInviteButtons
                        actions={actions}
                        partstat={userPartstat}
                        disabled={isCalendarDisabled || !isSelfAddressActive}
                    />
                </PopoverFooter>
            )}
        </PopoverContainer>
    );
};

export default EventPopover;

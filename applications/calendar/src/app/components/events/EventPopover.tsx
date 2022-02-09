import CalendarEventDateHeader from '@proton/components/components/calendarEventDateHeader/CalendarEventDateHeader';
import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';

import { getTimezonedFrequencyString } from '@proton/shared/lib/calendar/integration/getFrequencyString';
import { noop } from '@proton/shared/lib/helpers/function';
import { wait } from '@proton/shared/lib/helpers/promise';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Calendar, CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { useMemo } from 'react';
import {
    Alert,
    Badge,
    classnames,
    Loader,
    useLoading,
    CalendarInviteButtons,
    ButtonLike,
    Icon,
    Tooltip,
} from '@proton/components';
import { c } from 'ttag';
import { getIsCalendarEvent } from '../../containers/calendar/eventStore/cache/helper';
import {
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
    DisplayNameEmail,
} from '../../containers/calendar/interface';
import { INVITE_ACTION_TYPES, InviteActions } from '../../interfaces/Invite';
import { getEventErrorMessage } from './error';
import getEventInformation from './getEventInformation';
import PopoverContainer from './PopoverContainer';

import PopoverEventContent from './PopoverEventContent';
import PopoverFooter from './PopoverFooter';
import PopoverHeader from './PopoverHeader';
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
    tzid,
    weekStartsOn,
    isNarrow,
    displayNameEmailMap,
}: Props) => {
    const [loadingAction, withLoadingAction] = useLoading();

    const targetEventData = targetEvent?.data || {};
    const { eventReadResult, eventData, calendarData } = targetEventData;

    const isCalendarDisabled = getIsCalendarDisabled(calendarData);

    const model = useReadEvent(eventReadResult?.result, tzid);
    const { eventReadError, isEventReadLoading, eventTitleSafe, isCancelled, userPartstat, isSelfAddressActive } =
        getEventInformation(targetEvent, model);

    const isSubscribedCalendar = getIsSubscribedCalendar(calendarData);

    const handleDelete = () => {
        if (eventData && getIsCalendarEvent(eventData)) {
            const sendCancellationNotice =
                !eventReadError && !isCalendarDisabled && !isCancelled && [ACCEPTED, TENTATIVE].includes(userPartstat);
            const inviteActions = model.isOrganizer
                ? {
                      type: isSelfAddressActive
                          ? INVITE_ACTION_TYPES.CANCEL_INVITATION
                          : INVITE_ACTION_TYPES.CANCEL_DISABLED,
                      isProtonProtonInvite: !!eventData.IsProtonProtonInvite,
                      selfAddress: model.selfAddress,
                      selfAttendeeIndex: model.selfAttendeeIndex,
                  }
                : {
                      type: isSelfAddressActive
                          ? INVITE_ACTION_TYPES.DECLINE_INVITATION
                          : INVITE_ACTION_TYPES.DECLINE_DISABLED,
                      isProtonProtonInvite: !!eventData.IsProtonProtonInvite,
                      sendCancellationNotice,
                      selfAddress: model.selfAddress,
                      selfAttendeeIndex: model.selfAttendeeIndex,
                      partstat: ICAL_ATTENDEE_STATUS.DECLINED,
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

    const editButton = !isCalendarDisabled && (
        <Tooltip title={c('Event edit button tooltip').t`Edit event`}>
            <ButtonLike
                data-test-id="event-popover:edit"
                shape="ghost"
                onClick={handleEdit}
                disabled={loadingAction}
                icon
                size="small"
            >
                <Icon name="pen" />
            </ButtonLike>
        </Tooltip>
    );
    const deleteButton = !isSubscribedCalendar && (
        <Tooltip title={c('Event delete button tooltip').t`Delete event`}>
            <ButtonLike
                data-test-id="event-popover:delete"
                shape="ghost"
                onClick={loadingAction ? noop : handleDelete}
                loading={loadingAction}
                icon
                size="small"
            >
                <Icon name="trash" />
            </ButtonLike>
        </Tooltip>
    );
    const duplicateButton = model.isOrganizer && !!onDuplicate && (
        <Tooltip title={c('Event duplicate button tooltip').t`Duplicate event`}>
            <ButtonLike
                data-test-id="event-popover:duplicate"
                shape="ghost"
                onClick={handleDuplicate}
                disabled={loadingAction}
                icon
                size="small"
            >
                <Icon name="copy" />
            </ButtonLike>
        </Tooltip>
    );

    const actions = {
        accept: () => onChangePartstat(ICAL_ATTENDEE_STATUS.ACCEPTED),
        acceptTentatively: () => onChangePartstat(ICAL_ATTENDEE_STATUS.TENTATIVE),
        decline: () => onChangePartstat(ICAL_ATTENDEE_STATUS.DECLINED),
        retryCreateEvent: () => wait(0),
        retryUpdateEvent: () => wait(0),
    };

    const mergedClassName = classnames([
        'eventpopover flex flex-column flex-nowrap',
        isNarrow && 'eventpopover--full-width',
    ]);
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
            <PopoverContainer {...commonContainerProps} className={mergedClassName}>
                <PopoverHeader
                    {...commonHeaderProps}
                    actions={
                        !isSubscribedCalendar && <div className="flex flex-nowrap flex-justify-end">{deleteButton}</div>
                    }
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

    return (
        <PopoverContainer {...commonContainerProps} className={mergedClassName}>
            <PopoverHeader
                {...commonHeaderProps}
                actions={
                    !isSubscribedCalendar && (
                        <>
                            {editButton}
                            {duplicateButton}
                            {deleteButton}
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
            <div className="scroll-if-needed mb1">
                <PopoverEventContent
                    key={targetEvent.id}
                    calendar={calendarData}
                    model={model}
                    formatTime={formatTime}
                    displayNameEmailMap={displayNameEmailMap}
                />
            </div>
            {!isSubscribedCalendar && (
                <PopoverFooter
                    className="flex-item-noshrink flex-align-items-center flex-justify-space-between"
                    key={targetEvent.id}
                >
                    {!(isCancelled || model.isOrganizer) && (
                        <>
                            <div className="text-bold">{c('Calendar invite buttons label').t`Attending?`}</div>
                            <CalendarInviteButtons
                                className="mr1"
                                actions={actions}
                                partstat={userPartstat}
                                disabled={isCalendarDisabled || !isSelfAddressActive}
                            />
                        </>
                    )}
                </PopoverFooter>
            )}
        </PopoverContainer>
    );
};

export default EventPopover;

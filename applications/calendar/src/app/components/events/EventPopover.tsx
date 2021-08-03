import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';

import { getTimezonedFrequencyString } from '@proton/shared/lib/calendar/integration/getFrequencyString';
import { format as formatUTC } from '@proton/shared/lib/date-fns-utc';
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
import { EnDash } from '../EnDash';
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

    const dateHeader = useMemo(() => {
        const [dateStart, dateEnd] = [start, end].map((date) => formatUTC(date, 'cccc PPP', { locale: dateLocale }));
        const timeStart = formatTime(start);
        const timeEnd = formatTime(end);

        if (isAllDay && !isAllPartDay) {
            if (dateStart === dateEnd) {
                return dateStart;
            }
            return (
                <>
                    {dateStart}
                    <EnDash />
                    {dateEnd}
                </>
            );
        }
        if (dateStart === dateEnd) {
            return (
                <>
                    {dateStart} | {timeStart}
                    <EnDash />
                    {timeEnd}
                </>
            );
        }
        return (
            <>
                {dateStart} {timeStart}
                <EnDash />
                {dateEnd} {timeEnd}
            </>
        );
    }, [start, end, isAllDay]);

    const editButton = !isCalendarDisabled && (
        <Tooltip title={c('Event edit button tooltip').t`Edit event`}>
            <ButtonLike
                data-test-id="event-popover:edit"
                shape="ghost"
                onClick={handleEdit}
                loading={loadingAction}
                icon
                size="small"
                title={c('Action').t`Edit`}
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
                title={c('Action').t`Delete`}
            >
                <Icon name="trash" />
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

    if (eventReadError) {
        return (
            <PopoverContainer style={mergedStyle} className={mergedClassName} ref={popoverRef}>
                <PopoverHeader
                    onClose={onClose}
                    className="flex-item-noshrink"
                    actions={
                        !isSubscribedCalendar && <div className="flex flex-nowrap flex-justify-end">{deleteButton}</div>
                    }
                >
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <Alert className="mb1" type="error">
                    {getEventErrorMessage(eventReadError)}
                </Alert>
                {!isSubscribedCalendar && <PopoverFooter>{deleteButton}</PopoverFooter>}
            </PopoverContainer>
        );
    }

    if (isEventReadLoading) {
        return (
            <PopoverContainer style={mergedStyle} className="eventpopover p1" ref={popoverRef}>
                <Loader />
            </PopoverContainer>
        );
    }

    return (
        <PopoverContainer style={mergedStyle} className={mergedClassName} ref={popoverRef}>
            <PopoverHeader
                className="flex-item-noshrink"
                onClose={onClose}
                actions={
                    !isSubscribedCalendar && (
                        <>
                            {editButton}
                            {deleteButton}
                        </>
                    )
                }
            >
                {isCancelled && (
                    <Badge
                        type="light"
                        tooltip={c('Calendar invite info').t`This event has been cancelled`}
                        className="mb0-4"
                    >
                        <span className="text-uppercase">{c('Event cancelled status badge').t`cancelled`}</span>
                    </Badge>
                )}
                <h1 className="eventpopover-title lh-rg text-hyphens scroll-if-needed mb0-25" title={eventTitleSafe}>
                    {eventTitleSafe}
                </h1>
                <div className="mb2">
                    <div className="text-lg m0">{dateHeader}</div>
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

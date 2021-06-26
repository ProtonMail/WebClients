import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';

import { format as formatUTC } from '@proton/shared/lib/date-fns-utc';
import { noop } from '@proton/shared/lib/helpers/function';
import { wait } from '@proton/shared/lib/helpers/promise';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Calendar, CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import React, { useMemo } from 'react';
import {
    Alert,
    Badge,
    Button,
    classnames,
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Loader,
    Tooltip,
    useLoading,
    usePopperAnchor,
    CalendarInviteButtons,
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

const MoreButtons = ({
    onEdit,
    onDelete,
    loadingAction,
    isCalendarDisabled,
    hideDelete = false,
}: {
    onEdit?: () => void;
    onDelete?: () => void;
    loadingAction?: boolean;
    isCalendarDisabled?: boolean;
    hideDelete?: boolean;
}) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const emptyContent = '';
    return (
        <>
            <Tooltip title={c('Title').t`More options`}>
                <DropdownButton
                    title={c('Title').t`More options`}
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    hasCaret
                    caretClassName=""
                    loading={loadingAction && !isOpen}
                    size="small"
                >
                    {emptyContent}
                </DropdownButton>
            </Tooltip>
            <Dropdown
                id="popover-more-options"
                originalPlacement="bottom"
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                autoClose={false}
            >
                <DropdownMenu>
                    <DropdownMenuButton
                        data-test-id="event-popover:edit"
                        disabled={loadingAction || isCalendarDisabled}
                        className="text-left"
                        onClick={onEdit}
                    >
                        {c('Action').t`Edit`}
                    </DropdownMenuButton>
                    {!hideDelete && (
                        <DropdownMenuButton
                            data-test-id="event-popover:delete"
                            className="text-left"
                            onClick={loadingAction ? noop : onDelete}
                            loading={loadingAction}
                        >
                            {c('Action').t`Delete`}
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

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
                      selfAddress: model.selfAddress,
                      selfAttendeeIndex: model.selfAttendeeIndex,
                  }
                : {
                      type: isSelfAddressActive
                          ? INVITE_ACTION_TYPES.DECLINE_INVITATION
                          : INVITE_ACTION_TYPES.DECLINE_DISABLED,
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

    const editButton = (
        <Button
            data-test-id="event-popover:edit"
            onClick={handleEdit}
            disabled={loadingAction || isCalendarDisabled}
            className="ml1"
        >
            {c('Action').t`Edit`}
        </Button>
    );
    const deleteButton = !isSubscribedCalendar && (
        <Button
            data-test-id="event-popover:delete"
            onClick={loadingAction ? noop : handleDelete}
            loading={loadingAction}
        >
            {c('Action').t`Delete`}
        </Button>
    );

    const actions = {
        accept: () => onChangePartstat(ICAL_ATTENDEE_STATUS.ACCEPTED),
        acceptTentatively: () => onChangePartstat(ICAL_ATTENDEE_STATUS.TENTATIVE),
        decline: () => onChangePartstat(ICAL_ATTENDEE_STATUS.DECLINED),
        retryCreateEvent: () => wait(0),
        retryUpdateEvent: () => wait(0),
    };

    const mergedClassName = classnames([
        'eventpopover pt2 pl1-5 pr1-5 pb1 flex flex-column flex-nowrap',
        isNarrow && 'eventpopover--full-width',
    ]);
    const mergedStyle = isNarrow ? undefined : style;
    if (eventReadError) {
        return (
            <PopoverContainer style={mergedStyle} className={mergedClassName} ref={popoverRef}>
                <PopoverHeader onClose={onClose} className="flex-item-noshrink">
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <Alert type="error">{getEventErrorMessage(eventReadError)}</Alert>
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
            <PopoverHeader className="flex-item-noshrink" onClose={onClose}>
                <div className="color-weak">{dateHeader}</div>
                {isCancelled && (
                    <Badge type="error" tooltip={c('Calendar invite info').t`This event has been cancelled`}>
                        {c('Title').t`CANCELLED`}
                    </Badge>
                )}
                <h1 className="eventpopover-title lh-rg text-hyphens scroll-if-needed mb0-25" title={eventTitleSafe}>
                    {eventTitleSafe}
                </h1>
            </PopoverHeader>
            <div className="scroll-if-needed mb1">
                <PopoverEventContent
                    key={targetEvent.id}
                    calendar={calendarData}
                    event={targetEvent}
                    tzid={tzid}
                    weekStartsOn={weekStartsOn}
                    model={model}
                    formatTime={formatTime}
                    displayNameEmailMap={displayNameEmailMap}
                />
            </div>
            {!isSubscribedCalendar && (
                <PopoverFooter className="flex-item-noshrink" key={targetEvent.id}>
                    {isCancelled || model.isOrganizer ? (
                        <>
                            {deleteButton}
                            {editButton}
                        </>
                    ) : (
                        <>
                            <CalendarInviteButtons
                                className="mr1"
                                actions={actions}
                                partstat={userPartstat}
                                disabled={isCalendarDisabled || !isSelfAddressActive}
                            />
                            <MoreButtons
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                loadingAction={loadingAction}
                                isCalendarDisabled={isCalendarDisabled}
                                hideDelete={isSubscribedCalendar}
                            />
                        </>
                    )}
                </PopoverFooter>
            )}
        </PopoverContainer>
    );
};

export default EventPopover;

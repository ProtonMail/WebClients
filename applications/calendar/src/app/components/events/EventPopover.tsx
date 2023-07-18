import { useMemo, useRef } from 'react';

import { getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import {
    Alert,
    AppLink,
    Badge,
    CalendarInviteButtons,
    Icon,
    Loader,
    ReloadSpinner,
    Tooltip,
    useReadCalendarBootstrap,
} from '@proton/components';
import CalendarEventDateHeader from '@proton/components/components/calendarEventDateHeader/CalendarEventDateHeader';
import { useLoading } from '@proton/hooks';
import {
    getIsCalendarDisabled,
    getIsCalendarWritable,
    getIsOwnedCalendar,
    getIsSubscribedCalendar,
    getIsUnknownCalendar,
} from '@proton/shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS, VIEWS } from '@proton/shared/lib/calendar/constants';
import { getLinkToCalendarEvent, naiveGetIsDecryptionError } from '@proton/shared/lib/calendar/helper';
import { getTimezonedFrequencyString } from '@proton/shared/lib/calendar/recurrence/getFrequencyString';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { fromUTCDate, toLocalDate } from '@proton/shared/lib/date/timezone';
import { wait } from '@proton/shared/lib/helpers/promise';
import { dateLocale } from '@proton/shared/lib/i18n';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import noop from '@proton/utils/noop';

import {
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
    DisplayNameEmail,
} from '../../containers/calendar/interface';
import { getCanDeleteEvent, getCanDuplicateEvent, getCanEditEvent, getCanReplyToEvent } from '../../helpers/event';
import { getIsCalendarAppInDrawer } from '../../helpers/views';
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
    onEdit: () => void;
    onRefresh: () => Promise<void>;
    onDuplicate?: () => void;
    onChangePartstat: (inviteActions: InviteActions) => Promise<void>;
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
    onRefresh,
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
    const isDrawerApp = getIsCalendarAppInDrawer(view);
    const popoverEventContentRef = useRef<HTMLDivElement>(null);

    const [loadingDelete, withLoadingDelete] = useLoading();
    const [loadingRefresh, withLoadingRefresh] = useLoading();
    const readCalendarBootstrap = useReadCalendarBootstrap();

    const targetEventData = targetEvent?.data || {};
    const { eventReadResult, eventData, calendarData } = targetEventData;
    const calendarBootstrap = readCalendarBootstrap(calendarData.ID);
    const isCalendarDisabled = getIsCalendarDisabled(calendarData);
    const isSubscribedCalendar = getIsSubscribedCalendar(calendarData);
    const isOwnedCalendar = getIsOwnedCalendar(calendarData);
    const isUnknownCalendar = getIsUnknownCalendar(calendarData);
    const isCalendarWritable = getIsCalendarWritable(calendarData);

    const recurrenceDate = toLocalDate(fromUTCDate(start));
    const recurrenceTimestamp = getUnixTime(recurrenceDate);
    const linkTo =
        eventData &&
        getLinkToCalendarEvent({
            calendarID: eventData.CalendarID,
            eventID: eventData.ID,
            recurrenceID: recurrenceTimestamp,
        });

    const model = useReadEvent(eventReadResult?.result, tzid, calendarBootstrap?.CalendarSettings);
    const {
        eventReadError,
        isEventReadLoading,
        eventTitleSafe,
        isInvitation,
        isCancelled,
        userPartstat,
        isSelfAddressActive,
    } = getEventInformation(targetEvent, model);

    const handleDelete = () => {
        const sendCancellationNotice =
            !eventReadError && !isCalendarDisabled && !isCancelled && [ACCEPTED, TENTATIVE].includes(userPartstat);
        const inviteActions = model.isAttendee
            ? {
                  type: isSelfAddressActive
                      ? INVITE_ACTION_TYPES.DECLINE_INVITATION
                      : INVITE_ACTION_TYPES.DECLINE_DISABLED,
                  isProtonProtonInvite: model.isProtonProtonInvite,
                  sendCancellationNotice,
                  selfAddress: model.selfAddress,
                  selfAttendeeIndex: model.selfAttendeeIndex,
                  partstat: ICAL_ATTENDEE_STATUS.DECLINED,
              }
            : {
                  type: isSelfAddressActive
                      ? INVITE_ACTION_TYPES.CANCEL_INVITATION
                      : INVITE_ACTION_TYPES.CANCEL_DISABLED,
                  isProtonProtonInvite: model.isProtonProtonInvite,
                  selfAddress: model.selfAddress,
                  selfAttendeeIndex: model.selfAttendeeIndex,
              };
        return withLoadingDelete(onDelete(inviteActions));
    };

    const handleChangePartstat = (partstat: ICAL_ATTENDEE_STATUS) => {
        const inviteActions = {
            isProtonProtonInvite: model.isProtonProtonInvite,
            type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
            partstat,
            selfAddress: model.selfAddress,
            selfAttendeeIndex: model.selfAttendeeIndex,
        };

        return onChangePartstat(inviteActions);
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
                className="text-lg m-0"
            />
        ),
        [start, end, isAllDay, isAllPartDay, formatTime]
    );

    const editText = c('Edit event button tooltip').t`Edit event`;
    const deleteText = c('Delete event button tooltip').t`Delete event`;
    const duplicateText = c('Duplicate event button tooltip').t`Duplicate event`;
    const reloadText = c('Reload event button tooltip').t`Reload event`;
    const viewText = c('View event button tooltip').t`Open in a new tab`;

    const editButton = getCanEditEvent({ isUnknownCalendar, isCalendarDisabled }) && (
        <Tooltip title={editText}>
            <ButtonLike
                data-testid="event-popover:edit"
                shape="ghost"
                onClick={onEdit}
                disabled={loadingDelete}
                icon
                size="small"
            >
                <Icon name="pen" alt={editText} />
            </ButtonLike>
        </Tooltip>
    );
    const deleteButton = getCanDeleteEvent({ isOwnedCalendar, isCalendarWritable, isInvitation }) && (
        <Tooltip title={deleteText}>
            <ButtonLike
                data-testid="event-popover:delete"
                shape="ghost"
                onClick={loadingDelete ? noop : handleDelete}
                loading={loadingDelete}
                icon
                size="small"
            >
                <Icon name="trash" alt={deleteText} />
            </ButtonLike>
        </Tooltip>
    );
    const duplicateButton = onDuplicate &&
        getCanDuplicateEvent({
            isUnknownCalendar,
            isSubscribedCalendar,
            isOwnedCalendar,
            isOrganizer: model.isOrganizer,
            isInvitation,
        }) && (
            <Tooltip title={duplicateText}>
                <ButtonLike
                    data-testid="event-popover:duplicate"
                    shape="ghost"
                    onClick={onDuplicate}
                    disabled={loadingDelete}
                    icon
                    size="small"
                >
                    <Icon name="squares" alt={duplicateText} />
                </ButtonLike>
            </Tooltip>
        );

    const reloadButton = (
        <Tooltip title={reloadText}>
            <ButtonLike
                data-testid="event-popover:refresh"
                shape="ghost"
                onClick={loadingRefresh ? noop : () => withLoadingRefresh(onRefresh())}
                icon
                size="small"
            >
                <ReloadSpinner refreshing={loadingRefresh} alt={reloadText} />
            </ButtonLike>
        </Tooltip>
    );
    const viewEventButton = isDrawerApp && (
        <Tooltip title={viewText}>
            <AppLink
                to={linkTo || '/'}
                selfOpening
                className="mr-2 button button-small button-ghost-weak button-for-icon"
            >
                <Icon name="arrow-out-square" size={14} />
            </AppLink>
        </Tooltip>
    );

    const actions = {
        accept: () => handleChangePartstat(ICAL_ATTENDEE_STATUS.ACCEPTED),
        acceptTentatively: () => handleChangePartstat(ICAL_ATTENDEE_STATUS.TENTATIVE),
        decline: () => handleChangePartstat(ICAL_ATTENDEE_STATUS.DECLINED),
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
        const showReload = !naiveGetIsDecryptionError(eventReadError);

        const actions =
            deleteButton || showReload ? (
                <>
                    {showReload && <div className="flex flex-nowrap flex-justify-end">{reloadButton}</div>}
                    {deleteButton && <div className="flex flex-nowrap flex-justify-end">{deleteButton}</div>}
                </>
            ) : null;

        return (
            <PopoverContainer {...commonContainerProps} className={containerClassName}>
                <PopoverHeader {...commonHeaderProps} actions={actions}>
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <Alert className="mb-4" type="error">
                    {getEventErrorMessage(eventReadError)}
                </Alert>
            </PopoverContainer>
        );
    }

    if (isEventReadLoading) {
        return (
            <PopoverContainer {...commonContainerProps} className="eventpopover p-4">
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
                        className="mb-1"
                    >
                        <span className="text-uppercase">{c('Event canceled status badge').t`canceled`}</span>
                    </Badge>
                )}
                <h1 className="eventpopover-title lh-rg text-hyphens scroll-if-needed mb-1" title={eventTitleSafe}>
                    {eventTitleSafe}
                </h1>
                <div className="mb-4">
                    {dateHeader}
                    {!!frequencyString && <div className="color-weak">{frequencyString}</div>}
                </div>
            </PopoverHeader>
            <div className="scroll-if-needed mb-4" ref={popoverEventContentRef}>
                <PopoverEventContent
                    key={targetEvent.id}
                    calendar={calendarData}
                    model={model}
                    isDrawerApp={isDrawerApp}
                    formatTime={formatTime}
                    displayNameEmailMap={displayNameEmailMap}
                    popoverEventContentRef={popoverEventContentRef}
                />
            </div>
            {getCanReplyToEvent({ isOwnedCalendar, isCalendarWritable, isAttendee: model.isAttendee, isCancelled }) && (
                <PopoverFooter
                    className="flex-item-noshrink flex-align-items-center flex-justify-space-between gap-4 on-mobile-flex-column"
                    key={targetEvent.id}
                >
                    <div>
                        <strong>{c('Calendar invite buttons label').t`Attending?`}</strong>
                    </div>
                    <div className="ml-0 md:ml-auto">
                        <CalendarInviteButtons
                            actions={actions}
                            partstat={userPartstat}
                            disabled={isCalendarDisabled || !isSelfAddressActive}
                        />
                    </div>
                </PopoverFooter>
            )}
        </PopoverContainer>
    );
};

export default EventPopover;

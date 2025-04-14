import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import { Badge, CalendarEventDateHeader, CalendarInviteButtons, Loader, useActiveBreakpoint } from '@proton/components';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { useLoading } from '@proton/hooks';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import {
    getIsCalendarDisabled,
    getIsCalendarWritable,
    getIsOwnedCalendar,
    getIsSubscribedCalendar,
    getIsUnknownCalendar,
} from '@proton/shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS, VIEWS } from '@proton/shared/lib/calendar/constants';
import { getEncryptedRSVPComment } from '@proton/shared/lib/calendar/crypto/helpers';
import { getSharedSessionKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { naiveGetIsDecryptionError } from '@proton/shared/lib/calendar/helper';
import { getTimezonedFrequencyString } from '@proton/shared/lib/calendar/recurrence/getFrequencyString';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { wait } from '@proton/shared/lib/helpers/promise';
import { dateLocale } from '@proton/shared/lib/i18n';
import type {
    CalendarEventSharedData,
    PartstatData,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { getIsCalendarEvent } from '../../containers/calendar/eventStore/cache/helper';
import type {
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
    DisplayNameEmail,
} from '../../containers/calendar/interface';
import { getCanDeleteEvent, getCanDuplicateEvent, getCanEditEvent, getCanReplyToEvent } from '../../helpers/event';
import { getIsCalendarAppInDrawer } from '../../helpers/views';
import type { InviteActions } from '../../interfaces/Invite';
import { INVITE_ACTION_TYPES } from '../../interfaces/Invite';
import PopoverContainer from './PopoverContainer';
import PopoverEventContent from './PopoverEventContent';
import PopoverFooter from './PopoverFooter';
import PopoverHeader from './PopoverHeader';
import RsvpSection from './RsvpSection';
import { getEventErrorMessage } from './error';
import {
    EventReloadErrorAction,
    PopoverDeleteButton,
    PopoverDuplicateButton,
    PopoverEditButton,
    PopoverViewButton,
} from './eventPopoverButtons/EventPopoverButtons';
import getEventInformation from './getEventInformation';
import useReadEvent from './useReadEvent';

import './EventPopover.scss';

const { ACCEPTED, TENTATIVE } = ICAL_ATTENDEE_STATUS;

interface Props {
    formatTime: (date: Date) => string;
    /**
     * On edit event callback
     * @param userCanDuplicateEvent - used for busy slots to know if we should fetch them or not
     * @returns
     */
    onEdit: (userCanDuplicateEvent: boolean) => void;
    onRefresh: () => Promise<void>;
    onDuplicate?: () => void;
    onChangePartstat: (inviteActions: InviteActions, save: boolean) => Promise<void>;
    onDelete: (inviteActions: InviteActions) => Promise<void>;
    onClose: () => void;
    onNavigateToEventFromSearch?: (
        eventData: CalendarEventSharedData,
        eventComponent: VcalVeventComponent,
        occurrence?: { localStart: Date; occurrenceNumber: number }
    ) => void;
    style: any;
    popoverRef: any;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    view: VIEWS;
    tzid: string;
    weekStartsOn: WeekStartsOn;
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
    onNavigateToEventFromSearch,
    style,
    popoverRef,
    event: targetEvent,
    event: { start, end, isAllDay, isAllPartDay },
    view,
    tzid,
    weekStartsOn,
    displayNameEmailMap,
}: Props) => {
    const getAddressKeys = useGetAddressKeys();
    const getCalendarKeys = useGetCalendarKeys();
    const isDrawerApp = getIsCalendarAppInDrawer(view);
    const [{ hasPaidMail }] = useUser();

    const popoverContentRef = useRef<HTMLDivElement>(null);

    const [loadingDelete, withLoadingDelete] = useLoading();
    const [loadingRefresh, withLoadingRefresh] = useLoading();

    const targetEventData = targetEvent?.data || {};
    const { eventReadResult, eventData, calendarData, eventRecurrence } = targetEventData;
    const [calendarBootstrap] = useCalendarBootstrap(calendarData.ID);
    const [{ veventComponent }] = eventReadResult?.result || [{}];
    const isCalendarDisabled = getIsCalendarDisabled(calendarData);
    const isSubscribedCalendar = getIsSubscribedCalendar(calendarData);
    const isOwnedCalendar = getIsOwnedCalendar(calendarData);
    const isUnknownCalendar = getIsUnknownCalendar(calendarData);
    const isCalendarWritable = getIsCalendarWritable(calendarData);

    const { viewportWidth } = useActiveBreakpoint();
    const rsvpCommentEnabled = useFlag('RsvpCommentWeb');

    const [mailSettings] = useMailSettings();
    const { modal: linkModal } = useLinkHandler(popoverContentRef, mailSettings);

    const isSearchView = view === VIEWS.SEARCH;
    const model = useReadEvent(targetEventData, tzid, calendarBootstrap?.CalendarSettings);
    const {
        eventReadError,
        isEventReadLoading,
        eventTitleSafe,
        isInvitation,
        isCancelled,
        isUnanswered,
        userPartstat,
        userComment,
        isSelfAddressActive,
        color,
    } = getEventInformation(targetEvent, model, hasPaidMail);
    const canDuplicateEvent =
        !isSearchView &&
        onDuplicate &&
        getCanDuplicateEvent({
            isUnknownCalendar,
            isSubscribedCalendar,
            isOwnedCalendar,
            isOrganizer: model.isOrganizer,
            isInvitation,
        });

    const handleDelete = () => {
        const sendCancellationNotice =
            !eventReadError && !isCalendarDisabled && !isCancelled && [ACCEPTED, TENTATIVE].includes(userPartstat);

        if (model.isAttendee) {
            return withLoadingDelete(
                onDelete({
                    type: isSelfAddressActive
                        ? INVITE_ACTION_TYPES.DECLINE_INVITATION
                        : INVITE_ACTION_TYPES.DECLINE_DISABLED,
                    isProtonProtonInvite: model.isProtonProtonInvite,
                    sendCancellationNotice,
                    selfAddress: model.selfAddress,
                    selfAttendeeIndex: model.selfAttendeeIndex,
                    partstat: ICAL_ATTENDEE_STATUS.DECLINED,
                })
            );
        }

        return withLoadingDelete(
            onDelete({
                type: isSelfAddressActive ? INVITE_ACTION_TYPES.CANCEL_INVITATION : INVITE_ACTION_TYPES.CANCEL_DISABLED,
                isProtonProtonInvite: model.isProtonProtonInvite,
                selfAddress: model.selfAddress,
                selfAttendeeIndex: model.selfAttendeeIndex,
            })
        );
    };

    const handleChangePartStat = async (
        type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
        partstatData: PartstatData,
        save: boolean = true,
        oldPartstatData?: PartstatData
    ) => {
        // Get the addressID of the author of the note
        const selfAddressID = targetEvent.data.eventReadResult?.result?.[0].selfAddressData.selfAddress?.ID;

        // Encrypt comment if provided
        let comment, commentClearText;

        // Encryptip comment if
        // action is "save"
        // and comment is present in the action payload
        // and event already exists
        // and attendee has an address ID
        if (
            save &&
            partstatData.Comment &&
            targetEvent.data.eventData &&
            getIsCalendarEvent(targetEvent.data.eventData) &&
            selfAddressID
        ) {
            // Get events keypackets
            const sessionKey = await getSharedSessionKey({
                calendarEvent: targetEvent.data.eventData,
                getAddressKeys,
                getCalendarKeys,
            });

            // Get authos primary key
            const [commentAuthorPrimaryKey] = await getAddressKeys(selfAddressID);

            // Encrypt comment
            comment = await getEncryptedRSVPComment({
                authorPrivateKey: commentAuthorPrimaryKey.privateKey,
                comment: partstatData.Comment,
                sessionKey,
                eventUID: targetEvent.data.eventData.UID,
            });

            commentClearText = partstatData.Comment;
        }

        // Then await the parent component callback
        // Here it eighter update model
        // or update modal and save the event
        await onChangePartstat(
            {
                type,
                isProtonProtonInvite: model.isProtonProtonInvite,
                partstat: partstatData.Status,
                comment,
                commentClearText,
                selfAddress: model.selfAddress,
                selfAttendeeIndex: model.selfAttendeeIndex,
                oldPartstatData,
            },
            save
        );
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

    const showEditButton = !isSearchView && getCanEditEvent({ isUnknownCalendar, isCalendarDisabled });
    const showDeleteButton = !isSearchView && getCanDeleteEvent({ isOwnedCalendar, isCalendarWritable, isInvitation });
    const showDuplicateButton = !!canDuplicateEvent;
    const showViewEventButton = isSearchView || isDrawerApp;
    const mergedStyle = viewportWidth['<=small'] ? undefined : style;

    const frequencyString = useMemo(() => {
        if (!veventComponent) {
            return;
        }
        return getTimezonedFrequencyString(veventComponent.rrule, veventComponent.dtstart, {
            currentTzid: tzid,
            weekStartsOn,
            locale: dateLocale,
        });
    }, [veventComponent, tzid]);

    const commonContainerProps = {
        style: mergedStyle,
        ref: popoverRef,
        onClose,
    };
    const commonHeaderProps = {
        onClose,
        className: 'shrink-0',
    };

    if (eventReadError) {
        const showReload = !isSearchView && !naiveGetIsDecryptionError(eventReadError);
        return (
            <PopoverContainer {...commonContainerProps} className="eventpopover flex flex-column flex-nowrap">
                <PopoverHeader
                    {...commonHeaderProps}
                    actions={
                        <EventReloadErrorAction
                            showDeleteButton={showDeleteButton}
                            showReloadButton={showReload}
                            loadingDelete={loadingDelete}
                            loadingRefresh={loadingRefresh}
                            onDelete={handleDelete}
                            onRefresh={() => withLoadingRefresh(onRefresh())}
                        />
                    }
                >
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <span>{getEventErrorMessage(eventReadError)}</span>
            </PopoverContainer>
        );
    }

    if (isEventReadLoading) {
        return (
            <PopoverContainer {...commonContainerProps} className="eventpopover p-4">
                <PopoverHeader {...commonHeaderProps}>
                    <Loader />
                </PopoverHeader>
            </PopoverContainer>
        );
    }

    const canReplyToEvent = getCanReplyToEvent({
        isOwnedCalendar,
        isCalendarWritable,
        isAttendee: model.isAttendee,
        isCancelled,
    });

    return (
        <>
            <PopoverContainer {...commonContainerProps} className="relative eventpopover flex flex-column flex-nowrap">
                <PopoverHeader
                    {...commonHeaderProps}
                    actions={
                        <>
                            <PopoverEditButton
                                showButton={showEditButton}
                                loading={loadingDelete}
                                onEdit={() => onEdit(!!canDuplicateEvent)}
                            />
                            <PopoverDuplicateButton
                                showButton={showDuplicateButton}
                                loading={loadingDelete}
                                onDuplicate={onDuplicate}
                            />
                            <PopoverDeleteButton
                                showButton={showDeleteButton}
                                loading={loadingDelete}
                                onDelete={handleDelete}
                            />
                            <PopoverViewButton
                                showButton={showViewEventButton}
                                start={start}
                                isSearchView={isSearchView}
                                eventData={eventData}
                                onViewClick={() => {
                                    if (!eventData || !veventComponent) {
                                        return;
                                    }
                                    onNavigateToEventFromSearch?.(eventData, veventComponent, eventRecurrence);
                                }}
                            />
                        </>
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
                    <div className="flex mb-4 flex-nowrap">
                        <span
                            className={clsx(
                                'event-popover-calendar-border relative shrink-0 my-1',
                                isUnanswered && !isCancelled && 'isUnanswered'
                            )}
                            style={{ '--calendar-color': color }}
                        />
                        <div className="pt-2">
                            <h1
                                className="eventpopover-title lh-rg text-hyphens overflow-auto mb-0"
                                title={eventTitleSafe}
                            >
                                {eventTitleSafe}
                            </h1>
                            <div className={clsx([!!frequencyString ? 'mb-2' : 'mb-3'])}>
                                {dateHeader}
                                {!!frequencyString && <div className="color-weak">{frequencyString}</div>}
                            </div>
                        </div>
                    </div>
                </PopoverHeader>
                <div className="overflow-auto mb-4" ref={popoverContentRef}>
                    <PopoverEventContent
                        key={targetEvent.uniqueId}
                        calendar={calendarData}
                        model={model}
                        isDrawerApp={isDrawerApp}
                        formatTime={formatTime}
                        displayNameEmailMap={displayNameEmailMap}
                    />
                </div>
                {canReplyToEvent && !rsvpCommentEnabled && (
                    <PopoverFooter
                        className="shrink-0 items-start md:items-center justify-space-between gap-4 flex-column md:flex-row"
                        key={targetEvent.uniqueId}
                    >
                        <div>
                            <strong>{c('Calendar invite buttons label').t`Attending?`}</strong>
                        </div>
                        <div className="ml-0 md:ml-auto">
                            <CalendarInviteButtons
                                actions={{
                                    accept: () =>
                                        handleChangePartStat(INVITE_ACTION_TYPES.CHANGE_PARTSTAT, {
                                            Status: ICAL_ATTENDEE_STATUS.ACCEPTED,
                                        }),
                                    acceptTentatively: () =>
                                        handleChangePartStat(INVITE_ACTION_TYPES.CHANGE_PARTSTAT, {
                                            Status: ICAL_ATTENDEE_STATUS.TENTATIVE,
                                        }),
                                    decline: () =>
                                        handleChangePartStat(INVITE_ACTION_TYPES.CHANGE_PARTSTAT, {
                                            Status: ICAL_ATTENDEE_STATUS.DECLINED,
                                        }),
                                    retryCreateEvent: () => wait(0),
                                    retryUpdateEvent: () => wait(0),
                                }}
                                partstat={userPartstat}
                                disabled={isCalendarDisabled || !isSelfAddressActive || isSearchView}
                            />
                        </div>
                    </PopoverFooter>
                )}
                {canReplyToEvent && rsvpCommentEnabled && (
                    <div className="shrink-0 relative" key={targetEvent.uniqueId}>
                        <RsvpSection
                            handleChangePartstat={handleChangePartStat}
                            userPartstat={userPartstat}
                            userComment={userComment}
                            disabled={isCalendarDisabled || !isSelfAddressActive || isSearchView}
                            view={view}
                        />
                    </div>
                )}
            </PopoverContainer>
            {linkModal}
        </>
    );
};

export default EventPopover;

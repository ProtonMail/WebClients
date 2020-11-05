import React, { useMemo } from 'react';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { EVENT_VERIFICATION_STATUS, WeekStartsOn } from 'proton-shared/lib/calendar/interface';

import { format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { noop } from 'proton-shared/lib/helpers/function';
import { wait } from 'proton-shared/lib/helpers/promise';
import { dateLocale } from 'proton-shared/lib/i18n';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import {
    Alert,
    Badge,
    Button,
    classnames,
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    Loader,
    Tooltip,
    useLoading,
    usePopperAnchor,
} from 'react-components';
import InviteButtons from 'react-components/components/calendar/InviteButtons';
import { c } from 'ttag';
import { INVITE_ACTION_TYPES, InviteActions } from '../../containers/calendar/eventActions/inviteActions';
import { getIsCalendarEvent } from '../../containers/calendar/eventStore/cache/helper';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { EnDash } from '../EnDash';
import { getEventErrorMessage } from './error';
import getEventInformation from './getEventInformation';

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
}: {
    onEdit?: () => void;
    onDelete?: () => void;
    loadingAction?: boolean;
    isCalendarDisabled?: boolean;
}) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const emptyContent = '';
    return (
        <>
            <Tooltip title={c('Title').t`More options`} className="flex flex-item-noshrink">
                <DropdownButton
                    title={c('Title').t`More options`}
                    buttonRef={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    hasCaret
                    caretClassName=""
                    className="flex-item-noshrink pm-button pm-button--small"
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
                        className="alignleft"
                        onClick={onEdit}
                    >
                        {c('Action').t`Edit`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        data-test-id="event-popover:delete"
                        className="alignleft"
                        onClick={loadingAction ? noop : onDelete}
                        loading={loadingAction}
                    >
                        {c('Action').t`Delete`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

interface Props {
    formatTime: (date: Date) => string;
    onEdit: (event: CalendarEvent) => void;
    onChangePartstat: (partstat: ICAL_ATTENDEE_STATUS) => Promise<void>;
    onDelete: (event: CalendarEvent, inviteActions: InviteActions) => Promise<void>;
    onClose: () => void;
    style: any;
    popoverRef: any;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    tzid: string;
    weekStartsOn: WeekStartsOn;
    isNarrow: boolean;
    contactEmailMap: SimpleMap<ContactEmail>;
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
    contactEmailMap,
}: Props) => {
    const [loadingAction, withLoadingAction] = useLoading();

    const targetEventData = targetEvent?.data || {};
    const { eventReadResult, eventData, calendarData } = targetEventData;

    const isCalendarDisabled = getIsCalendarDisabled(calendarData);

    const model = useReadEvent(eventReadResult?.result, tzid);
    const {
        eventReadError,
        isEventReadLoading,
        eventTitleSafe,
        verificationStatus,
        isCancelled,
        userPartstat,
        isSelfAddressDisabled,
    } = getEventInformation(targetEvent, model);

    const handleDelete = () => {
        if (eventData && getIsCalendarEvent(eventData)) {
            const sendCancellationNotice =
                !eventReadError &&
                !isSelfAddressDisabled &&
                !isCalendarDisabled &&
                !isCancelled &&
                [ACCEPTED, TENTATIVE].includes(userPartstat);
            const inviteActions = model.isOrganizer
                ? {
                      type: INVITE_ACTION_TYPES.NONE,
                  }
                : {
                      type: INVITE_ACTION_TYPES.DECLINE,
                      sendCancellationNotice,
                  };
            withLoadingAction(onDelete(eventData, inviteActions)).catch(noop);
        }
    };

    const handleEdit = () => {
        if (eventData && getIsCalendarEvent(eventData)) {
            onEdit(eventData);
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
    const deleteButton = (
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
            <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
                <PopoverHeader onClose={onClose} className="flex-item-noshrink">
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <Alert type="error">{getEventErrorMessage(eventReadError)}</Alert>
                <PopoverFooter>{deleteButton}</PopoverFooter>
            </div>
        );
    }

    if (isEventReadLoading) {
        return (
            <div style={mergedStyle} className="eventpopover p1" ref={popoverRef}>
                <Loader />
            </div>
        );
    }

    return (
        <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
            <PopoverHeader className="flex-item-noshrink" onClose={onClose}>
                <div className="color-subheader">{dateHeader}</div>
                {isCancelled && (
                    <Badge type="error" tooltip={c('Calendar invite info').t`This event has been cancelled`}>
                        {c('Title').t`CANCELLED`}
                    </Badge>
                )}
                <h1 className="eventpopover-title lh-standard hyphens scroll-if-needed mb0-25" title={eventTitleSafe}>
                    {eventTitleSafe}
                </h1>
                {verificationStatus === EVENT_VERIFICATION_STATUS.SUCCESSFUL && (
                    <div className="mb0-75 flex flex-nowrap flex-items-center">
                        <span className="flex flex-item-noshrink mr1">
                            <Icon name="lock-check" />
                        </span>
                        <span className="flex-item-fluid">{c('Event info').t`Event verified`}</span>
                    </div>
                )}
                {verificationStatus === EVENT_VERIFICATION_STATUS.FAILED && (
                    <Alert type="warning" learnMore="https://protonmail.com/blog/protoncalendar-security-model/">
                        {c('Event info').t`The verification of the event signature failed.`}
                    </Alert>
                )}
            </PopoverHeader>
            <div className="scroll-if-needed mb1">
                <PopoverEventContent
                    Calendar={calendarData}
                    isCalendarDisabled={isCalendarDisabled}
                    event={targetEvent}
                    tzid={tzid}
                    weekStartsOn={weekStartsOn}
                    model={model}
                    formatTime={formatTime}
                    contactEmailMap={contactEmailMap}
                />
            </div>
            <PopoverFooter className="flex-item-noshrink" key={targetEvent.id}>
                {isCancelled || model.isOrganizer ? (
                    <>
                        {deleteButton}
                        {editButton}
                    </>
                ) : (
                    <>
                        <InviteButtons
                            className="mr1"
                            actions={actions}
                            partstat={userPartstat}
                            disabled={isCalendarDisabled || isSelfAddressDisabled}
                        />
                        <MoreButtons
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            loadingAction={loadingAction}
                            isCalendarDisabled={isCalendarDisabled}
                        />
                    </>
                )}
            </PopoverFooter>
        </div>
    );
};

export default EventPopover;

import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';

import { format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { noop } from 'proton-shared/lib/helpers/function';
import { wait } from 'proton-shared/lib/helpers/promise';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Address } from 'proton-shared/lib/interfaces';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import React, { useMemo } from 'react';
import {
    Alert,
    Badge,
    Button,
    classnames,
    Dropdown,
    DropdownButton,
    Loader,
    Tooltip,
    useLoading,
    usePopperAnchor,
} from 'react-components';
import InviteButtons from 'react-components/components/calendar/InviteButtons';
import { c } from 'ttag';
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

interface Props {
    formatTime: (date: Date) => string;
    onEdit: (event: CalendarEvent) => void;
    onChangePartstat: (partstat: ICAL_ATTENDEE_STATUS) => Promise<void>;
    onDelete: (event: CalendarEvent, isInvitation?: boolean, sendCancellationNotice?: boolean) => Promise<void>;
    onClose: () => void;
    style: any;
    popoverRef: any;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    tzid: string;
    weekStartsOn: WeekStartsOn;
    isNarrow: boolean;
    contactEmailMap: SimpleMap<ContactEmail>;
    addresses: Address[];
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
    addresses,
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
        isCancelled,
        userPartstat,
        isAddressDisabled,
    } = getEventInformation(targetEvent, model, addresses);

    const handleDelete = () => {
        if (eventData && getIsCalendarEvent(eventData)) {
            const sendCancellationNotice =
                !eventReadError &&
                !isAddressDisabled &&
                !isCalendarDisabled &&
                !isCancelled &&
                [ACCEPTED, TENTATIVE].includes(userPartstat);
            withLoadingAction(onDelete(eventData, !model.isOrganizer, sendCancellationNotice)).catch(noop);
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
            className="mr1"
        >
            {c('Action').t`Edit`}
        </Button>
    );
    const deleteButton = (
        <Button
            data-test-id="event-popover:delete"
            onClick={loadingAction ? noop : handleDelete}
            loading={loadingAction}
            className="mr1"
        >
            {c('Action').t`Delete`}
        </Button>
    );

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const emptyContent = '';
    const moreOptions = (
        <div>
            <Tooltip title={c('Title').t`More options`} className="flex flex-item-noshrink">
                <DropdownButton
                    title={c('Title').t`More options`}
                    buttonRef={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    hasCaret
                    caretClassName=""
                    className="flex-item-noshrink toolbar-button toolbar-button--dropdown"
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
                className="toolbar-dropdown"
            >
                <Button
                    data-test-id="event-popover:edit"
                    disabled={loadingAction || isCalendarDisabled}
                    className="dropDown-item-button w100 pr1 pl1 pt0-5 pb0-5 alignleft"
                    onClick={handleEdit}
                >
                    {c('Action').t`Edit`}
                </Button>
                <Button
                    data-test-id="event-popover:delete"
                    className="dropDown-item-button w100 pr1 pl1 pt0-5 pb0-5 alignleft"
                    onClick={loadingAction ? noop : handleDelete}
                    loading={loadingAction}
                >
                    {c('Action').t`Delete`}
                </Button>
            </Dropdown>
        </div>
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
            <PopoverHeader className="ml0-5 flex-item-noshrink" onClose={onClose}>
                <div className="color-subheader">{dateHeader}</div>
                <h1 className="eventpopover-title lh-standard ellipsis-four-lines cut mb0-5" title={eventTitleSafe}>
                    {eventTitleSafe}
                </h1>
                {isCancelled && (
                    <Badge type="error" tooltip={c('Calendar invite info').t`This event has been cancelled`}>
                        {c('Title').t`CANCELLED`}
                    </Badge>
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
            <PopoverFooter className="flex-item-noshrink">
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
                            disabled={isCalendarDisabled || isAddressDisabled}
                        />
                        {moreOptions}
                    </>
                )}
            </PopoverFooter>
        </div>
    );
};

export default EventPopover;

import type { CSSProperties, MouseEventHandler, Ref } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useActiveBreakpoint, useBusySlotsAvailable } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import type { Address } from '@proton/shared/lib/interfaces';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import debounce from '@proton/utils/debounce';
import throttle from '@proton/utils/throttle';

import { getCannotSaveEvent } from '../../helpers/event';
import { useRect } from '../../hooks/useRect';
import type { InviteActions } from '../../interfaces/Invite';
import { INVITE_ACTION_TYPES } from '../../interfaces/Invite';
import { busySlotsActions } from '../../store/busySlots/busySlotsSlice';
import { useCalendarDispatch } from '../../store/hooks';
import PopoverContainer from '../events/PopoverContainer';
import PopoverFooter from '../events/PopoverFooter';
import PopoverHeader from '../events/PopoverHeader';
import EventForm from './EventForm';
import validateEventModel from './eventForm/validateEventModel';
import { ACTION, useForm } from './hooks/useForm';

interface Props {
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    model: EventModel;
    addresses: Address[];
    onSave: (inviteActions: InviteActions) => Promise<void>;
    onClose: () => void;
    onEdit: (value: EventModel) => void;
    style: CSSProperties;
    popoverRef: Ref<HTMLDivElement>;
    setModel: (value: EventModel) => void;
    isCreateEvent: boolean;
    isInvitation: boolean;
    isDraggingDisabled?: boolean;
    isDrawerApp?: boolean;
    view: VIEWS;
    hasZoomError: boolean;
}

const MAX_OFFSCREEN_OFFSET = 20;

const CreateEventPopover = ({
    model,
    setModel,
    onSave,
    onEdit,
    onClose,
    style,
    popoverRef,
    displayWeekNumbers,
    weekStartsOn,
    addresses,
    isCreateEvent,
    isInvitation,
    isDraggingDisabled = false,
    isDrawerApp,
    view,
    hasZoomError,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const dispatch = useCalendarDispatch();
    const isBusySlotsAvailable = useBusySlotsAvailable();
    const [participantError, setParticipantError] = useState(false);
    const errors = { ...validateEventModel(model), participantError };
    const cannotSave = getCannotSaveEvent({
        isOwnedCalendar: model.calendar.isOwned,
        isOrganizer: model.isOrganizer,
        numberOfAttendees: model.attendees.length,
        maxAttendees: mailSettings?.RecipientLimit,
    });
    const formRef = useRef<HTMLFormElement>(null);
    const { isSubmitted, loadingAction, lastAction, handleSubmit } = useForm({
        containerEl: formRef.current,
        errors,
        onSave,
    });
    const formRect = useRect(formRef.current);

    const { viewportWidth } = useActiveBreakpoint();

    const handleMore = () => {
        onEdit(model);
    };
    // new events have no uid yet
    const inviteActions = {
        // the type will be more properly assessed in getSaveEventActions by getCorrectedSaveEventActions
        type: model.isAttendee ? INVITE_ACTION_TYPES.NONE : INVITE_ACTION_TYPES.SEND_INVITATION,
        selfAddress: model.selfAddress,
    };

    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [initialPosition, setInitialPosition] = useState({ clientX: 0, clientY: 0 });
    const { clientX, clientY } = initialPosition;

    const dragStyle: CSSProperties = {
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    };
    const mergedStyle = viewportWidth['<=small'] ? dragStyle : { ...style, ...dragStyle };

    const handleMouseDown: MouseEventHandler<HTMLElement> = (event) => {
        event.preventDefault();
        setInitialPosition(event);
        setIsDragging(true);
    };

    const handleStopDragging = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (event: MouseEvent) => {
        const prevOffset = offset;
        const cursorMoveXOffset = event.clientX - clientX;
        const cursorMoveYOffset = event.clientY - clientY;

        setOffset(({ x, y }) => ({
            x:
                event.clientX >= 0 && event.clientX <= document.documentElement.clientWidth
                    ? prevOffset.x + cursorMoveXOffset
                    : x,
            y:
                event.clientY >= 0 && event.clientY <= document.documentElement.clientHeight
                    ? prevOffset.y + cursorMoveYOffset
                    : y,
        }));
    };

    useEffect(() => {
        if (isBusySlotsAvailable) {
            dispatch(busySlotsActions.setDisplay(true));
        }
    }, []);

    useEffect(() => {
        if (!formRect) {
            return;
        }

        // Only adjust if the form is significantly off-screen (more than 20px)
        // and not being actively dragged
        if (formRect.top < -MAX_OFFSCREEN_OFFSET && offset.y && !isDragging) {
            const viewportHeight = window.innerHeight;

            // Calculate the maximum allowed upward offset to keep the form partially visible
            const maxUpwardOffset = -(viewportHeight - 100); // Keep at least 100px visible

            // Calculate new offset while ensuring form stays partially visible
            const proposedOffset = offset.y - formRect.top;
            const boundedOffset = Math.max(maxUpwardOffset, Math.min(0, proposedOffset));

            // Only update if the change is significant
            if (Math.abs(boundedOffset - offset.y) > MAX_OFFSCREEN_OFFSET) {
                debounce(() => setOffset((prevState) => ({ ...prevState, y: boundedOffset })), 50)();
            }
        }
    }, [formRect?.top]);

    useEffect(() => {
        if (isDraggingDisabled) {
            return;
        }

        const throttledMouseMove = throttle(handleMouseMove, 20);
        const debouncedStopDragging = debounce(handleStopDragging, 50);

        if (isDragging) {
            document.addEventListener('mousemove', throttledMouseMove);
            document.addEventListener('mouseup', debouncedStopDragging);
            document.addEventListener('mouseleave', debouncedStopDragging);
        }

        return () => {
            document.removeEventListener('mousemove', throttledMouseMove);
            document.removeEventListener('mouseup', debouncedStopDragging);
            document.removeEventListener('mouseleave', debouncedStopDragging);
        };
    }, [isDraggingDisabled, isDragging]);

    return (
        <PopoverContainer style={mergedStyle} className="eventpopover" ref={popoverRef} onClose={onClose}>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(inviteActions);
                }}
                className="form--icon-labels"
                ref={formRef}
            >
                <PopoverHeader
                    className={isDraggingDisabled ? '' : 'eventpopover-header--draggable'}
                    onMouseDown={handleMouseDown}
                    onClose={onClose}
                    isDraggable={!isDraggingDisabled}
                />
                <EventForm
                    displayWeekNumbers={displayWeekNumbers}
                    addresses={addresses}
                    weekStartsOn={weekStartsOn}
                    isSubmitted={isSubmitted}
                    errors={errors}
                    model={model}
                    setModel={setModel}
                    isMinimal
                    isCreateEvent={isCreateEvent}
                    isInvitation={isInvitation}
                    setParticipantError={setParticipantError}
                    isDrawerApp={isDrawerApp}
                    view={view}
                    hasZoomError={hasZoomError}
                />
                <PopoverFooter className="justify-end flex-nowrap flex-column-reverse sm:flex-row gap-2">
                    <Button
                        disabled={loadingAction}
                        data-testid="create-event-popover:more-event-options"
                        className="w-full sm:w-auto"
                        onClick={handleMore}
                    >{c('Action').t`More options`}</Button>
                    <Button
                        color="norm"
                        data-testid="create-event-popover:save"
                        type="submit"
                        className={isDrawerApp ? 'w-full' : undefined}
                        loading={loadingAction && lastAction === ACTION.SUBMIT}
                        disabled={loadingAction || cannotSave}
                    >
                        {c('Action').t`Save`}
                    </Button>
                </PopoverFooter>
            </form>
        </PopoverContainer>
    );
};

export default CreateEventPopover;

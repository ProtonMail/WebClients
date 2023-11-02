import { CSSProperties, MouseEventHandler, Ref, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { PrimaryButton, useMailSettings } from '@proton/components';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { Address } from '@proton/shared/lib/interfaces';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';
import debounce from '@proton/utils/debounce';
import throttle from '@proton/utils/throttle';

import { getCannotSaveEvent } from '../../helpers/event';
import { useRect } from '../../hooks/useRect';
import { INVITE_ACTION_TYPES, InviteActions } from '../../interfaces/Invite';
import PopoverContainer from '../events/PopoverContainer';
import PopoverFooter from '../events/PopoverFooter';
import PopoverHeader from '../events/PopoverHeader';
import EventForm from './EventForm';
import validateEventModel from './eventForm/validateEventModel';
import { ACTION, useForm } from './hooks/useForm';

interface Props {
    isNarrow: boolean;
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
}

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
    isNarrow,
    isCreateEvent,
    isInvitation,
    isDraggingDisabled = false,
    isDrawerApp,
}: Props) => {
    const [mailSettings] = useMailSettings();
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

    const handleMore = () => {
        onEdit(model);
    };
    // new events have no uid yet
    const inviteActions = {
        // the type will be more properly assessed in getSaveEventActions
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
    const mergedStyle = isNarrow ? dragStyle : { ...style, ...dragStyle };

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
        if (!formRect) {
            return;
        }

        // When there's an existing offset and added content e.g. a participant group
        // causes the popover to go off screen, we adjust the offset to stick to the top
        if (formRect.top < 0 && offset.y && !isDragging) {
            // Debouncing lets us have a slightly better flicker
            debounce(() => setOffset((prevState) => ({ ...prevState, y: prevState.y - formRect.top })), 50)();
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
                />
                <PopoverFooter
                    className={clsx([
                        'flex-justify-end flex-nowrap on-tiny-mobile-flex-column-reverse gap-2',
                        isDrawerApp && 'flex-column ',
                    ])}
                >
                    <Button
                        disabled={loadingAction}
                        data-testid="create-event-popover:more-event-options"
                        className="w-full sm:w-auto"
                        onClick={handleMore}
                    >{c('Action').t`More options`}</Button>
                    <PrimaryButton
                        data-testid="create-event-popover:save"
                        type="submit"
                        className={isDrawerApp ? 'w-full' : undefined}
                        loading={loadingAction && lastAction === ACTION.SUBMIT}
                        disabled={loadingAction || cannotSave}
                    >
                        {c('Action').t`Save`}
                    </PrimaryButton>
                </PopoverFooter>
            </form>
        </PopoverContainer>
    );
};

export default CreateEventPopover;

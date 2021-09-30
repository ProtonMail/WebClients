import { CSSProperties, Ref, useRef, useState } from 'react';
import { c } from 'ttag';

import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { Address } from '@proton/shared/lib/interfaces';
import { Button, classnames, PrimaryButton, useHotkeys } from '@proton/components';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';

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
    textareaMaxHeight: number;
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
    textareaMaxHeight,
}: Props) => {
    const [participantError, setParticipantError] = useState(false);
    const errors = { ...validateEventModel(model), participantError };
    const cannotSave = model.isOrganizer && model.attendees.length > 100;
    const formRef = useRef<HTMLFormElement>(null);
    const { isSubmitted, loadingAction, lastAction, handleSubmit } = useForm({
        containerEl: formRef.current,
        errors,
        onSave,
    });

    const handleMore = () => {
        onEdit(model);
    };
    // new events have no uid yet
    const inviteActions = {
        // the type will be more properly assessed in getSaveEventActions
        type: model.isOrganizer ? INVITE_ACTION_TYPES.SEND_INVITATION : INVITE_ACTION_TYPES.NONE,
        selfAddress: model.selfAddress,
    };

    useHotkeys(formRef, [
        [
            'Escape',
            async (e) => {
                e.stopPropagation();
                onClose();
            },
        ],
    ]);

    return (
        <PopoverContainer
            style={isNarrow ? undefined : style}
            className={classnames(['eventpopover pt2 pl1-5 pr1-5 pb1', isNarrow && 'eventpopover--full-width'])}
            ref={popoverRef}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(inviteActions);
                }}
                className="form--icon-labels"
                ref={formRef}
            >
                <PopoverHeader onClose={onClose} />
                <EventForm
                    displayWeekNumbers={displayWeekNumbers}
                    addresses={addresses}
                    weekStartsOn={weekStartsOn}
                    isSubmitted={isSubmitted}
                    errors={errors}
                    model={model}
                    setModel={setModel}
                    isMinimal
                    isCreateEvent
                    textareaMaxHeight={textareaMaxHeight}
                    setParticipantError={setParticipantError}
                />
                <PopoverFooter>
                    <Button
                        disabled={loadingAction}
                        data-test-id="create-event-popover:more-event-options"
                        className="mr1"
                        onClick={handleMore}
                    >{c('Action').t`More options`}</Button>
                    <PrimaryButton
                        data-test-id="create-event-popover:save"
                        type="submit"
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

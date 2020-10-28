import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import React, { CSSProperties, Ref, useRef } from 'react';
import { Button, classnames, PrimaryButton, useCombinedRefs } from 'react-components';
import { c } from 'ttag';
import { EventModel } from '../../interfaces/EventModel';
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
    onSave: (value: EventModel) => Promise<void>;
    onClose: () => void;
    onEdit: (value: EventModel) => void;
    style: CSSProperties;
    popoverRef: Ref<HTMLFormElement>;
    setModel: (value: EventModel) => void;
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
    isNarrow,
}: Props) => {
    const errors = validateEventModel(model);
    const formRef = useRef<HTMLFormElement>(null);
    const { isSubmitted, loadingAction, lastAction, handleSubmit } = useForm({
        containerEl: formRef.current,
        model,
        errors,
        onSave,
    });

    const handleMore = () => {
        onEdit(model);
    };

    return (
        <form
            style={isNarrow ? undefined : style}
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
            className={classnames([
                'eventpopover pm-form--iconLabels pt2 pl1-5 pr1-5 pb1',
                isNarrow && 'eventpopover--full-width',
            ])}
            ref={useCombinedRefs<HTMLFormElement>(formRef, popoverRef)}
        >
            <PopoverHeader onClose={onClose} />
            <EventForm
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
                isSubmitted={isSubmitted}
                errors={errors}
                model={model}
                setModel={setModel}
                isMinimal
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
                    disabled={loadingAction}
                >
                    {c('Action').t`Save`}
                </PrimaryButton>
            </PopoverFooter>
        </form>
    );
};

export default CreateEventPopover;

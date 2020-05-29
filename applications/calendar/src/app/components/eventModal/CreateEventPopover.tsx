import React, { CSSProperties, Ref, useRef } from 'react';
import { useCombinedRefs, Button, PrimaryButton, classnames } from 'react-components';
import { c } from 'ttag';
import validateEventModel from './eventForm/validateEventModel';
import PopoverHeader from '../events/PopoverHeader';
import PopoverFooter from '../events/PopoverFooter';
import { useForm } from './hooks/useForm';
import MinimalEventForm from './MinimalEventForm';
import { EventModel } from '../../interfaces/EventModel';
import { WeekStartsOn } from '../../containers/calendar/interface';

interface Props {
    isNarrow: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    isCreateEvent: boolean;
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
    const { isSubmitted, loadingAction, handleSubmit } = useForm({
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
            className={classnames(['eventpopover pm-form--iconLabels', isNarrow && 'eventpopover--full-width'])}
            ref={useCombinedRefs<HTMLFormElement>(formRef, popoverRef)}
        >
            <PopoverHeader onClose={onClose} />
            <MinimalEventForm
                isNarrow={isNarrow}
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
                isSubmitted={isSubmitted}
                errors={errors}
                model={model}
                setModel={setModel}
            />
            <PopoverFooter>
                <Button
                    data-test-id="create-event-popover:more-event-options"
                    className="mr1"
                    onClick={handleMore}
                >{c('Action').t`More options`}</Button>
                <PrimaryButton
                    data-test-id="create-event-popover:save"
                    type="submit"
                    loading={loadingAction}
                >
                    {c('Action').t`Save`}
                </PrimaryButton>
            </PopoverFooter>
        </form>
    );
};

export default CreateEventPopover;

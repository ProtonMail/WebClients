import React, { Ref, useRef } from 'react';
import { useCombinedRefs, SmallButton, PrimaryButton, classnames } from 'react-components';
import { c } from 'ttag';
import validateEventModel from './eventForm/validateEventModel';
import PopoverHeader from '../events/PopoverHeader';
import PopoverFooter from '../events/PopoverFooter';
import PopoverContent from '../events/PopoverContent';
import { useForm } from './useForm';
import MinimalEventForm from './MinimalEventForm';
import { EventModel } from '../../interfaces/EventModel';

interface Props {
    isNarrow: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: number;
    isCreateEvent: boolean;
    model: EventModel;
    onSave: (value: EventModel) => Promise<void>;
    onDelete: () => Promise<void>;
    onClose: () => void;
    onEdit: (value: EventModel) => void;
    style: object;
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
    isNarrow
}: Props) => {
    const errors = validateEventModel(model);
    const formRef = useRef<HTMLFormElement>(null);
    const { isSubmitted, loadingAction, handleSubmit } = useForm({
        containerEl: formRef.current,
        model,
        errors,
        onSave
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
            className={classnames(['eventpopover p1 pm-form--iconLabels', isNarrow && 'eventpopover--full-width'])}
            ref={useCombinedRefs<HTMLFormElement>(formRef, popoverRef)}
        >
            <PopoverHeader onClose={onClose} />
            <PopoverContent>
                <div className="w95">
                    <MinimalEventForm
                        isNarrow={isNarrow}
                        displayWeekNumbers={displayWeekNumbers}
                        weekStartsOn={weekStartsOn}
                        isSubmitted={isSubmitted}
                        errors={errors}
                        model={model}
                        setModel={setModel}
                    />
                </div>
            </PopoverContent>
            <PopoverFooter>
                <SmallButton
                    data-test-id="create-event-popover:more-event-options"
                    className="mr1"
                    onClick={handleMore}
                >{c('Action').t`More options`}</SmallButton>
                <PrimaryButton
                    data-test-id="create-event-popover:save"
                    type="submit"
                    className="pm-button--small"
                    loading={loadingAction}
                >
                    {c('Action').t`Save`}
                </PrimaryButton>
            </PopoverFooter>
        </form>
    );
};

export default CreateEventPopover;

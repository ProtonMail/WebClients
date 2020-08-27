import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import React from 'react';
import { FormModal, PrimaryButton, Button } from 'react-components';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';

import validateEventModel from './eventForm/validateEventModel';

import EventForm from './EventForm';
import { useForm, ACTION } from './hooks/useForm';
import { EventModel } from '../../interfaces/EventModel';

interface Props {
    isNarrow: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    isCreateEvent: boolean;
    model: EventModel;
    onSave: (value: EventModel) => Promise<void>;
    onDelete: () => Promise<void>;
    onClose: () => void;
    setModel: (value: EventModel) => void;
    tzid: string;
}

const CreateEventModal = ({
    isNarrow,
    displayWeekNumbers,
    weekStartsOn,
    isCreateEvent,
    model,
    setModel,
    onSave,
    onDelete,
    onClose,
    tzid,
    ...rest
}: Props) => {
    const errors = validateEventModel(model);
    const { isSubmitted, loadingAction, handleDelete, handleSubmit, lastAction } = useForm({
        containerEl: document.body, // Annoying to get a ref, mostly fine to use this
        model,
        errors,
        onSave,
        onDelete,
    });

    // Can't use default close button in FormModal because button type reset resets selects
    const closeButton = (
        <Button data-test-id="event-creation-modal:cancel-event-creation" disabled={loadingAction} onClick={onClose}>
            {c('Action').t`Cancel`}
        </Button>
    );

    const submitButton = (
        <PrimaryButton
            data-test-id="create-event-modal:save"
            loading={loadingAction && lastAction === ACTION.SUBMIT}
            disabled={loadingAction}
            type="submit"
        >
            {c('Action').t`Save`}
        </PrimaryButton>
    );

    const submit = isCreateEvent ? (
        submitButton
    ) : (
        <div>
            <Button
                onClick={loadingAction ? noop : handleDelete}
                loading={loadingAction && lastAction === ACTION.DELETE}
                disabled={loadingAction}
                className="mr1"
            >{c('Action').t`Delete`}</Button>
            {submitButton}
        </div>
    );

    return (
        <FormModal
            displayTitle={false}
            title={c('Title').t`Create event`}
            loading={loadingAction}
            onSubmit={loadingAction ? noop : handleSubmit}
            submit={submit}
            close={closeButton}
            onClose={onClose}
            {...rest}
        >
            <EventForm
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
                isSubmitted={isSubmitted}
                errors={errors}
                model={model}
                setModel={setModel}
                tzid={tzid}
            />
        </FormModal>
    );
};

export default CreateEventModal;

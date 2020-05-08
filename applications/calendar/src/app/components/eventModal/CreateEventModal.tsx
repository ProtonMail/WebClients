import React from 'react';
import { FormModal, PrimaryButton, Button } from 'react-components';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';

import validateEventModel from './eventForm/validateEventModel';

import EventForm from './EventForm';
import { useForm } from './useForm';
import { EventModel } from '../../interfaces/EventModel';
import { WeekStartsOn } from '../../containers/calendar/interface';

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
    ...rest
}: Props) => {
    const errors = validateEventModel(model);
    const { isSubmitted, loadingAction, handleDelete, handleSubmit } = useForm({
        containerEl: document.body, // Annyoing to get a ref, mostly fine to use this
        model,
        errors,
        onSave,
        onDelete
    });

    // Can't use default close button in FormModal because button type reset resets selects
    const closeButton = (
        <Button data-test-id="event-creation-modal:cancel-event-creation" disabled={loadingAction} onClick={onClose}>
            {c('Action').t`Cancel`}
        </Button>
    );

    const submitButton = (
        <PrimaryButton data-test-id="create-event-modal:save" loading={loadingAction} type="submit">
            {c('Action').t`Save`}
        </PrimaryButton>
    );

    const submit = isCreateEvent ? (
        submitButton
    ) : (
        <div>
            <Button onClick={loadingAction ? noop : handleDelete} loading={loadingAction} className="mr1">{c('Action')
                .t`Delete`}</Button>
            {submitButton}
        </div>
    );

    const form = (() => {
        /*
        if (model.type === 'alarm') {
            return (<AlarmForm model={model} setModel={setModel}/>);
        }
        if (model.type === 'task') {
            return (<TaskForm model={model} setModel={setModel}/>);
        }
        */
        return (
            <EventForm
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
                isNarrow={isNarrow}
                isSubmitted={isSubmitted}
                errors={errors}
                model={model}
                setModel={setModel}
            />
        );
    })();

    const title = isCreateEvent ? c('Title').t`Create new event` : c('Title').t`Edit event`;

    return (
        <FormModal
            className="pm-modal--shorterLabels"
            title={title}
            loading={loadingAction}
            onSubmit={loadingAction ? noop : handleSubmit}
            submit={submit}
            close={closeButton}
            onClose={onClose}
            {...rest}
        >
            {form}
        </FormModal>
    );
};

export default CreateEventModal;

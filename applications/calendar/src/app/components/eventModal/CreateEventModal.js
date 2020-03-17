import React from 'react';
import { FormModal, PrimaryButton, Button } from 'react-components';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';

import { validate } from './eventForm/state';

import EventForm from './EventForm';
import { useForm } from './useForm';

const CreateEventModal = ({
    isNarrow,
    displayWeekNumbers,
    weekStartsOn,
    tzid,
    isCreateEvent,
    model,
    setModel,
    onSave,
    onDelete,
    onClose,
    ...rest
}) => {
    const errors = validate(model);
    const { isSubmitted, loadingAction, i18n, handleDelete, handleSubmit } = useForm({
        formEl: document.body, // Annyoing to get a ref, mostly fine to use this
        model,
        errors,
        onSave,
        onClose,
        onDelete,
        isCreateEvent,
        tzid
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

    return (
        <FormModal
            className="pm-modal--shorterLabels"
            title={isCreateEvent ? i18n.create : i18n.update}
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

CreateEventModal.propTypes = {};

export default CreateEventModal;

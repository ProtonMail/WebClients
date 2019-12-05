import React from 'react';
import { FormModal, PrimaryButton, Button, useActiveBreakpoint } from 'react-components';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';

import { validate } from './eventForm/state';

import EventForm from './EventForm';
import { useForm } from './useForm';

const CreateEventModal = ({
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
    const { isNarrow } = useActiveBreakpoint();

    const errors = validate(model);
    const { isSubmitted, loadingAction, i18n, handleDelete, handleSubmit } = useForm({
        model,
        errors,
        onSave,
        onClose,
        onDelete,
        isCreateEvent,
        tzid
    });

    const submitButton = (
        <PrimaryButton loading={loadingAction} type="submit">
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
            onClose={onClose}
            {...rest}
        >
            {form}
        </FormModal>
    );
};

CreateEventModal.propTypes = {
};

export default CreateEventModal;

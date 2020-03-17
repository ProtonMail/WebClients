import React, { useRef } from 'react';
import { useCombinedRefs, SmallButton, PrimaryButton, classnames } from 'react-components';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { validate } from './eventForm/state';
import PopoverHeader from '../events/PopoverHeader';
import PopoverFooter from '../events/PopoverFooter';
import PopoverContent from '../events/PopoverContent';
import { useForm } from './useForm';
import MinimalEventForm from './MinimalEventForm';

const CreateEventPopover = ({
    model,
    setModel,
    onSave,
    onEdit,
    isCreateEvent,
    onClose,
    style,
    popoverRef,
    displayWeekNumbers,
    weekStartsOn,
    isNarrow
}) => {
    const errors = validate(model);
    const formRef = useRef();
    const { isSubmitted, loadingAction, handleSubmit } = useForm({
        formEl: formRef.current,
        model,
        errors,
        onSave,
        onClose,
        isCreateEvent
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
            ref={useCombinedRefs(formRef, popoverRef)}
        >
            <PopoverHeader onClose={onClose} />
            <PopoverContent>
                <div className="w95">
                    <MinimalEventForm
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

CreateEventPopover.propTypes = {
    tzid: PropTypes.string,
    weekStartsOn: PropTypes.number,
    formatTime: PropTypes.func,
    style: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onEditEvent: PropTypes.func,
    event: PropTypes.object,
    layout: PropTypes.object
};

export default CreateEventPopover;

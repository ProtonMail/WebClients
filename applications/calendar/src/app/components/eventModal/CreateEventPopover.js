import React from 'react';
import { SmallButton, PrimaryButton } from 'react-components';
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
    weekStartsOn
}) => {
    const errors = validate(model);
    const { isSubmitted, loadingAction, handleSubmit } = useForm({ model, errors, onSave, onClose, isCreateEvent });

    const handleMore = () => {
        onEdit(model);
    };

    return (
        <form
            style={style}
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
            className="eventpopover p1 pm-form--iconLabels"
            ref={popoverRef}
        >
            <PopoverHeader onClose={onClose}/>
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
                <SmallButton className="mr1" onClick={handleMore}>{c('Action').t`More options`}</SmallButton>
                <PrimaryButton type="submit" className="pm-button--small" loading={loadingAction}>
                    {c('Action').t`Save`}
                </PrimaryButton>
            </PopoverFooter>
        </form>
    );
};

CreateEventPopover.propTypes = {
    tzid: PropTypes.string,
    formatTime: PropTypes.func,
    style: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onEditEvent: PropTypes.func,
    event: PropTypes.object,
    layout: PropTypes.object
};

export default CreateEventPopover;

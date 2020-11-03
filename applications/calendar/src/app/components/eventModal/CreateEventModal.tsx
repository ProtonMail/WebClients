import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import { noop } from 'proton-shared/lib/helpers/function';
import { getDisplayTitle } from 'proton-shared/lib/calendar/helper';
import { Address } from 'proton-shared/lib/interfaces';
import React from 'react';
import { Button, FormModal, PrimaryButton } from 'react-components';
import { c } from 'ttag';
import {
    INVITE_ACTION_TYPES,
    InviteActions,
    NO_INVITE_ACTION,
} from '../../containers/calendar/eventActions/inviteActions';
import { findUserAttendeeModel } from '../../helpers/attendees';
import { EventModel } from '../../interfaces/EventModel';

import EventForm from './EventForm';

import validateEventModel from './eventForm/validateEventModel';
import { ACTION, useForm } from './hooks/useForm';

interface Props {
    isNarrow: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    isCreateEvent: boolean;
    model: EventModel;
    addresses: Address[];
    onSave: (value: EventModel) => Promise<void>;
    onDelete: (inviteActions: InviteActions) => Promise<void>;
    onClose: () => void;
    setModel: (value: EventModel) => void;
    tzid: string;
}

const CreateEventModal = ({
    isNarrow,
    displayWeekNumbers,
    weekStartsOn,
    isCreateEvent,
    addresses,
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
    const isCancelled = model.status === ICAL_EVENT_STATUS.CANCELLED;
    const { userAttendee, userAddress } = findUserAttendeeModel(model.attendees, addresses);
    const isAddressDisabled = userAddress ? userAddress.Status === 0 : true;
    const userPartstat = userAttendee?.partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
    const sendCancellationNotice =
        !isAddressDisabled &&
        !isCancelled &&
        [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE].includes(userPartstat);
    const modalTitle = isCreateEvent ? c('Title').t`Create event` : c('Title').t`Edit event`;

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
    const inviteActions = model.isOrganizer
        ? NO_INVITE_ACTION
        : { type: INVITE_ACTION_TYPES.DECLINE, sendCancellationNotice };

    const handleDeleteWithNotice = () => handleDelete(inviteActions);
    const submit = isCreateEvent ? (
        submitButton
    ) : (
        <div>
            <Button
                onClick={loadingAction ? noop : handleDeleteWithNotice}
                loading={loadingAction && lastAction === ACTION.DELETE}
                disabled={loadingAction}
                className="mr1"
            >{c('Action').t`Delete`}</Button>
            {submitButton}
        </div>
    );

    return (
        <FormModal
            displayTitle={!model.isOrganizer}
            title={model.isOrganizer ? modalTitle : getDisplayTitle(model.title)}
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

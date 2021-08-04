import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { noop } from '@proton/shared/lib/helpers/function';
import { Address } from '@proton/shared/lib/interfaces';
import { useState } from 'react';
import { Button, FormModal, PrimaryButton } from '@proton/components';
import { c } from 'ttag';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';
import { INVITE_ACTION_TYPES, InviteActions } from '../../interfaces/Invite';

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
    onSave: (inviteActions: InviteActions) => Promise<void>;
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
    const [participantError, setParticipantError] = useState(false);
    const errors = { ...validateEventModel(model), participantError };
    const { isSubmitted, loadingAction, handleDelete, handleSubmit, lastAction } = useForm({
        containerEl: document.body, // Annoying to get a ref, mostly fine to use this
        errors,
        onSave,
        onDelete,
    });
    const isCancelled = model.status === ICAL_EVENT_STATUS.CANCELLED;
    const { selfAddress, selfAttendeeIndex, attendees } = model;
    const cannotSave = model.isOrganizer && attendees.length > 100;
    const selfAttendee = selfAttendeeIndex !== undefined ? model.attendees[selfAttendeeIndex] : undefined;
    const isSelfAddressActive = selfAddress ? getIsAddressActive(selfAddress) : true;
    const userPartstat = selfAttendee?.partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
    const sendCancellationNotice =
        !isCancelled && [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE].includes(userPartstat);
    const modalTitle = isCreateEvent ? c('Title').t`Create event` : c('Title').t`Edit event`;
    const displayTitle = !(model.isOrganizer && model.selfAddress?.Status !== 0);
    // new events have no uid yet
    const inviteActions = {
        // the type will be more properly assessed in getSaveEventActions
        type: model.isOrganizer ? INVITE_ACTION_TYPES.SEND_INVITATION : INVITE_ACTION_TYPES.NONE,
        selfAddress,
    };
    const { isSubscribed: isSubscribedCalendar } = model.calendar;

    // Can't use default close button in FormModal because button type reset resets selects
    const closeButton = (
        <Button data-test-id="event-creation-modal:cancel-event-creation" disabled={loadingAction} onClick={onClose}>
            {c('Action').t`Cancel`}
        </Button>
    );

    const handleSubmitWithInviteActions = () => handleSubmit(inviteActions);
    const submitButton = (
        <PrimaryButton
            data-test-id="create-event-modal:save"
            onClick={loadingAction ? noop : handleSubmitWithInviteActions}
            loading={loadingAction && lastAction === ACTION.SUBMIT}
            disabled={loadingAction || cannotSave}
            type="submit"
        >
            {c('Action').t`Save`}
        </PrimaryButton>
    );
    const deleteInviteActions = model.isOrganizer
        ? {
              type: isSelfAddressActive ? INVITE_ACTION_TYPES.CANCEL_INVITATION : INVITE_ACTION_TYPES.CANCEL_DISABLED,
              selfAddress: model.selfAddress,
              selfAttendeeIndex: model.selfAttendeeIndex,
          }
        : {
              type: isSelfAddressActive ? INVITE_ACTION_TYPES.DECLINE_INVITATION : INVITE_ACTION_TYPES.DECLINE_DISABLED,
              partstat: ICAL_ATTENDEE_STATUS.DECLINED,
              sendCancellationNotice,
              selfAddress: model.selfAddress,
              selfAttendeeIndex: model.selfAttendeeIndex,
          };

    const handleDeleteWithNotice = () => handleDelete(deleteInviteActions);
    const submit = isCreateEvent ? (
        submitButton
    ) : (
        <div>
            {!isSubscribedCalendar && (
                <Button
                    onClick={loadingAction ? noop : handleDeleteWithNotice}
                    loading={loadingAction && lastAction === ACTION.DELETE}
                    disabled={loadingAction}
                    className="mr1"
                >{c('Action').t`Delete`}</Button>
            )}
            {submitButton}
        </div>
    );

    return (
        <FormModal
            displayTitle={displayTitle}
            title={displayTitle ? getDisplayTitle(model.title) : modalTitle}
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
                addresses={addresses}
                isSubmitted={isSubmitted}
                errors={errors}
                model={model}
                setModel={setModel}
                tzid={tzid}
                isCreateEvent={isCreateEvent}
                setParticipantError={setParticipantError}
                isSubscribedCalendar={isSubscribedCalendar}
            />
        </FormModal>
    );
};

export default CreateEventModal;

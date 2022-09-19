import { useState } from 'react';

import { c } from 'ttag';

import { BasicModal, Button, Form } from '@proton/components';
import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS, MAX_ATTENDEES } from '@proton/shared/lib/calendar/constants';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { Address } from '@proton/shared/lib/interfaces';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import { INVITE_ACTION_TYPES, InviteActions } from '../../interfaces/Invite';
import EventForm from './EventForm';
import validateEventModel from './eventForm/validateEventModel';
import { ACTION, useForm } from './hooks/useForm';

interface Props {
    isNarrow: boolean;
    isOpen: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    isCreateEvent: boolean;
    isDuplicating: boolean;
    model: EventModel;
    addresses: Address[];
    onSave: (inviteActions: InviteActions) => Promise<void>;
    onDelete: (inviteActions: InviteActions) => Promise<void>;
    onClose: () => void;
    setModel: (value: EventModel) => void;
    tzid: string;
    onExit: () => void;
}

const CreateEventModal = ({
    isNarrow,
    isOpen,
    displayWeekNumbers,
    weekStartsOn,
    isCreateEvent,
    isDuplicating,
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
    const cannotSave = model.isOrganizer && attendees.length > MAX_ATTENDEES;
    const selfAttendee = selfAttendeeIndex !== undefined ? model.attendees[selfAttendeeIndex] : undefined;
    const isSelfAddressActive = selfAddress ? getIsAddressActive(selfAddress) : true;
    const userPartstat = selfAttendee?.partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
    const sendCancellationNotice =
        !isCancelled && [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE].includes(userPartstat);
    const displayTitle = !(model.isOrganizer && model.selfAddress?.Status !== 0);
    // new events have no uid yet
    const inviteActions = {
        // the type will be more properly assessed in getSaveEventActions
        type: model.isOrganizer ? INVITE_ACTION_TYPES.SEND_INVITATION : INVITE_ACTION_TYPES.NONE,
        selfAddress,
    };
    const { isSubscribed: isSubscribedCalendar } = model.calendar;

    const handleSubmitWithInviteActions = () => handleSubmit(inviteActions);
    const submitButton = (
        <Button
            color="norm"
            data-test-id="create-event-modal:save"
            loading={loadingAction && lastAction === ACTION.SUBMIT}
            disabled={loadingAction || cannotSave}
            type="submit"
            className={isCreateEvent ? 'on-tiny-mobile-w100' : ''}
        >
            {c('Action').t`Save`}
        </Button>
    );
    const deleteInviteActions = model.isOrganizer
        ? {
              type: isSelfAddressActive ? INVITE_ACTION_TYPES.CANCEL_INVITATION : INVITE_ACTION_TYPES.CANCEL_DISABLED,
              isProtonProtonInvite: model.isProtonProtonInvite,
              selfAddress: model.selfAddress,
              selfAttendeeIndex: model.selfAttendeeIndex,
          }
        : {
              type: isSelfAddressActive ? INVITE_ACTION_TYPES.DECLINE_INVITATION : INVITE_ACTION_TYPES.DECLINE_DISABLED,
              isProtonProtonInvite: model.isProtonProtonInvite,
              partstat: ICAL_ATTENDEE_STATUS.DECLINED,
              sendCancellationNotice,
              selfAddress: model.selfAddress,
              selfAttendeeIndex: model.selfAttendeeIndex,
          };

    const handleDeleteWithNotice = () => handleDelete(deleteInviteActions);
    const submit = isCreateEvent ? (
        submitButton
    ) : (
        <div className="flex on-tiny-mobile-w100 on-tiny-mobile-flex-column">
            {!isSubscribedCalendar && (
                <Button
                    onClick={loadingAction ? noop : handleDeleteWithNotice}
                    loading={loadingAction && lastAction === ACTION.DELETE}
                    disabled={loadingAction}
                    className="mr0-5 on-tiny-mobile-mr0 on-tiny-mobile-mb0-5"
                >{c('Action').t`Delete`}</Button>
            )}
            {submitButton}
        </div>
    );

    return (
        <BasicModal
            size="large"
            fullscreenOnMobile
            onClose={onClose}
            {...rest}
            isOpen={isOpen}
            className="w100"
            as={Form}
            onSubmit={() => {
                if (!loadingAction) {
                    handleSubmitWithInviteActions();
                }
            }}
            title={displayTitle ? getDisplayTitle(model.title) : undefined}
            footer={
                <>
                    <Button
                        className="no-tiny-mobile"
                        data-test-id="event-creation-modal:cancel-event-creation"
                        disabled={loadingAction}
                        onClick={onClose}
                    >
                        {c('Action').t`Cancel`}
                    </Button>
                    {submit}
                </>
            }
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
                isDuplicating={isDuplicating}
            />
        </BasicModal>
    );
};

export default CreateEventModal;

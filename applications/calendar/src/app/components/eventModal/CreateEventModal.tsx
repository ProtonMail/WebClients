import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { BasicModal, Form, useMailSettings } from '@proton/components';
import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import { Address } from '@proton/shared/lib/interfaces';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import { getCanDeleteEvent, getCanEditSharedEventData, getCannotSaveEvent } from '../../helpers/event';
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
    isInvitation: boolean;
    isDuplicating: boolean;
    isDrawerApp: boolean;
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
    isInvitation,
    isDuplicating,
    isDrawerApp,
    addresses,
    model,
    setModel,
    onSave,
    onDelete,
    onClose,
    tzid,
    ...rest
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [participantError, setParticipantError] = useState(false);
    const errors = { ...validateEventModel(model), participantError };
    const { isSubmitted, loadingAction, handleDelete, handleSubmit, lastAction } = useForm({
        containerEl: document.body, // Annoying to get a ref, mostly fine to use this
        errors,
        onSave,
        onDelete,
    });
    const { isOrganizer, isAttendee, selfAddress, selfAttendeeIndex, attendees, status } = model;
    const { isOwned: isOwnedCalendar, isWritable: isCalendarWritable } = model.calendar;

    const isCancelled = status === ICAL_EVENT_STATUS.CANCELLED;
    const selfAttendee = selfAttendeeIndex !== undefined ? attendees[selfAttendeeIndex] : undefined;
    const isSelfAddressActive = selfAddress ? getIsAddressActive(selfAddress) : true;
    const userPartstat = selfAttendee?.partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
    const sendCancellationNotice =
        !isCancelled && [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE].includes(userPartstat);
    const canEditSharedEventData =
        isCreateEvent ||
        getCanEditSharedEventData({
            isOwnedCalendar,
            isCalendarWritable,
            isOrganizer,
            isAttendee,
            isInvitation,
            selfAddress,
        });
    const cannotSave = getCannotSaveEvent({
        isOwnedCalendar,
        isOrganizer,
        numberOfAttendees: attendees.length,
        canEditSharedEventData,
        maxAttendees: mailSettings?.RecipientLimit,
    });

    // new events have no uid yet
    const inviteActions = {
        // the type will be more properly assessed in getSaveEventActions
        type: model.isAttendee ? INVITE_ACTION_TYPES.NONE : INVITE_ACTION_TYPES.SEND_INVITATION,
        selfAddress,
    };

    const handleSubmitWithInviteActions = () => handleSubmit(inviteActions);
    const submitButton = (
        <Button
            color="norm"
            data-testid="create-event-modal:save"
            loading={loadingAction && lastAction === ACTION.SUBMIT}
            disabled={loadingAction || cannotSave}
            type="submit"
            className={isCreateEvent ? 'w-full sm:w-auto' : ''}
        >
            {c('Action').t`Save`}
        </Button>
    );

    const deleteInviteActions = model.isAttendee
        ? {
              type: isSelfAddressActive ? INVITE_ACTION_TYPES.DECLINE_INVITATION : INVITE_ACTION_TYPES.DECLINE_DISABLED,
              isProtonProtonInvite: model.isProtonProtonInvite,
              partstat: ICAL_ATTENDEE_STATUS.DECLINED,
              sendCancellationNotice,
              selfAddress: model.selfAddress,
              selfAttendeeIndex: model.selfAttendeeIndex,
          }
        : {
              type: isSelfAddressActive ? INVITE_ACTION_TYPES.CANCEL_INVITATION : INVITE_ACTION_TYPES.CANCEL_DISABLED,
              isProtonProtonInvite: model.isProtonProtonInvite,
              selfAddress: model.selfAddress,
              selfAttendeeIndex: model.selfAttendeeIndex,
          };
    const handleDeleteWithNotice = () => handleDelete(deleteInviteActions);
    const deleteButton = (
        <Button
            onClick={loadingAction ? noop : handleDeleteWithNotice}
            loading={loadingAction && lastAction === ACTION.DELETE}
            disabled={loadingAction}
            className="mr-0 mt-2 sm:my-0 sm:mr-2"
        >{c('Action').t`Delete`}</Button>
    );

    const endAlignedButtons = isCreateEvent ? (
        submitButton
    ) : (
        <div className="flex w-full sm:w-auto on-tiny-mobile-flex-column on-tiny-mobile-flex-column-reverse">
            {getCanDeleteEvent({
                isOwnedCalendar,
                isCalendarWritable,
                isInvitation,
            }) && deleteButton}
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
            className="w-full"
            as={Form}
            onSubmit={() => {
                if (!loadingAction) {
                    handleSubmitWithInviteActions();
                }
            }}
            // if the user can't edit shared event data, the modal will have a reduced form
            title={canEditSharedEventData ? undefined : getDisplayTitle(model.title)}
            // breaking only for non-editable form
            titleClassName={canEditSharedEventData ? undefined : 'text-break'}
            footer={
                <>
                    <Button
                        className="no-tiny-mobile"
                        data-testid="event-creation-modal:cancel-event-creation"
                        disabled={loadingAction}
                        onClick={onClose}
                    >
                        {c('Action').t`Cancel`}
                    </Button>
                    {endAlignedButtons}
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
                canEditSharedEventData={canEditSharedEventData}
                isCreateEvent={isCreateEvent}
                isInvitation={isInvitation}
                setParticipantError={setParticipantError}
                isOwnedCalendar={isOwnedCalendar}
                isCalendarWritable={isCalendarWritable}
                isDuplicating={isDuplicating}
                isDrawerApp={isDrawerApp}
            />
        </BasicModal>
    );
};

export default CreateEventModal;

import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { BasicModal, Form, useBusySlotsAvailable, useMailSettings } from '@proton/components';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getIsAddressActive } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import { getCanDeleteEvent, getCanEditSharedEventData, getCannotSaveEvent } from '../../helpers/event';
import type { InviteActions } from '../../interfaces/Invite';
import { INVITE_ACTION_TYPES } from '../../interfaces/Invite';
import { busySlotsActions } from '../../store/busySlots/busySlotsSlice';
import { useCalendarDispatch } from '../../store/hooks';
import EventForm from './EventForm';
import validateEventModel from './eventForm/validateEventModel';
import { ACTION, useForm } from './hooks/useForm';

interface Props {
    isSmallViewport: boolean;
    isOpen: boolean;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    isCreateEvent: boolean;
    isInvitation: boolean;
    isDrawerApp: boolean;
    model: EventModel;
    addresses: Address[];
    onSave: (inviteActions: InviteActions) => Promise<void>;
    onDelete: (inviteActions: InviteActions) => Promise<void>;
    onClose: () => void;
    setModel: (value: EventModel) => void;
    tzid: string;
    onDisplayBusySlots: () => void;
    onExit: () => void;
    view: VIEWS;
}

const CreateEventModal = ({
    isSmallViewport,
    isOpen,
    displayWeekNumbers,
    weekStartsOn,
    isCreateEvent,
    isInvitation,
    isDrawerApp,
    addresses,
    model,
    setModel,
    onSave,
    onDelete,
    onClose,
    tzid,
    onDisplayBusySlots,
    view,
    ...rest
}: Props) => {
    const [mailSettings] = useMailSettings();
    const isBusySlotsAvailable = useBusySlotsAvailable();
    const dispatch = useCalendarDispatch();
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
        // the type will be more properly assessed in getSaveEventActions by getCorrectedSaveEventActions
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
        >{c('Action').t`Delete`}</Button>
    );

    const endAlignedButtons = isCreateEvent ? (
        submitButton
    ) : (
        <div className="flex w-full sm:w-auto flex-column-reverse sm:flex-row gap-2">
            {getCanDeleteEvent({
                isOwnedCalendar,
                isCalendarWritable,
                isInvitation,
            }) && deleteButton}
            {submitButton}
        </div>
    );

    useEffect(() => {
        if (isBusySlotsAvailable && isOpen) {
            dispatch(busySlotsActions.setDisplay(false));
        }
    }, [isOpen]);

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
                        className="hidden sm:inline-block"
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
                isDrawerApp={isDrawerApp}
                isSmallViewport={isSmallViewport}
                onDisplayBusySlots={onDisplayBusySlots}
                view={view}
            />
        </BasicModal>
    );
};

export default CreateEventModal;

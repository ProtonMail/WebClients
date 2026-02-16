import { useRef } from 'react';

import { c } from 'ttag';

import IconRow from '@proton/components/components/iconRow/MemoizedIconRow';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import { PARTICIPANTS_INPUT_ID } from '@proton/shared/lib/calendar/constants';
import { getIsProtonUID } from '@proton/shared/lib/calendar/helper';
import type { Address } from '@proton/shared/lib/interfaces';
import type { AttendeeModel, EventModel } from '@proton/shared/lib/interfaces/calendar';

import { getOrganizerAndSelfAddressModel } from '../eventForm/state';
import ParticipantsInput from '../inputs/ParticipantsInput';

interface Props {
    canEditSharedEventData: boolean;
    isCreateEvent: boolean;
    model: EventModel;
    setModel: (value: EventModel) => void;
    addresses: Address[];
    isMinimal?: boolean;
    onDisplayBusySlots?: () => void;
    setParticipantError?: (value: boolean) => void;
    view: VIEWS;
}

export const RowParticipants = ({
    canEditSharedEventData,
    isCreateEvent,
    model,
    setModel,
    setParticipantError,
    addresses,
    isMinimal,
    onDisplayBusySlots,
    view,
}: Props) => {
    const isOrganizerOfInvitationRef = useRef(!isCreateEvent && !!model.isOrganizer);
    const isOrganizerOfInvitation = isOrganizerOfInvitationRef.current;

    const isImportedEvent = model.uid && !getIsProtonUID(model.uid);
    if (!canEditSharedEventData || isImportedEvent) {
        return null;
    }

    const handleChangeAttendees = (value: AttendeeModel[]) => {
        const { organizer: newOrganizer, selfAddress: newSelfAddress } = getOrganizerAndSelfAddressModel({
            attendees: value,
            addressID: model.member.addressID,
            addresses,
            isAttendee: false,
        });

        setModel({
            ...model,
            attendees: value,
            isOrganizer: isOrganizerOfInvitation ? true : !!value.length,
            organizer: isOrganizerOfInvitation ? model.organizer : newOrganizer,
            selfAddress: isOrganizerOfInvitation ? model.selfAddress : newSelfAddress,
        });
    };

    return (
        <IconRow icon="users" title={c('Label').t`Participants`} id={PARTICIPANTS_INPUT_ID}>
            <ParticipantsInput
                placeholder={c('Placeholder').t`Add participants`}
                id={PARTICIPANTS_INPUT_ID}
                value={model.attendees}
                isOwnedCalendar={model.calendar.isOwned}
                onChange={handleChangeAttendees}
                organizer={model.organizer}
                addresses={addresses}
                collapsible={!isMinimal}
                setParticipantError={setParticipantError}
                onDisplayBusySlots={onDisplayBusySlots}
                displayBusySlots={!!isMinimal}
                view={view}
            />
        </IconRow>
    );
};

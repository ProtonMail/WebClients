import React, { useRef } from 'react';

import debounce from 'lodash/debounce';

import { SimpleMap } from '@proton/shared/lib/interfaces';
import { AttendeeModel } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { busyTimeSlotsActions } from '../../../store/busyTimeSlots/busyTimeSlotsSlice';
import { useCalendarDispatch } from '../../../store/hooks';
import BusyParticipantRow from './BusyParticipantRow';
import ParticipantRow from './ParticipantRow';

interface Props {
    attendeeModel: AttendeeModel[];
    contactEmailsMap: SimpleMap<ContactEmail>;
    isBusyTimeSlotsAvailable: boolean;
    onDelete: (attendee: AttendeeModel) => void;
    toggleIsOptional: (attendee: AttendeeModel) => void;
}

const ParticipantRows = ({
    attendeeModel,
    contactEmailsMap,
    isBusyTimeSlotsAvailable,
    onDelete,
    toggleIsOptional,
}: Props) => {
    const dispatch = useCalendarDispatch();
    const busyAttendeeHighlighted = useRef<string | undefined>(undefined);

    const onChangeHighlight = debounce(() => {
        dispatch(busyTimeSlotsActions.setHighlightedAttendee(busyAttendeeHighlighted.current));
    }, 150);

    return (
        <div className="pt-1">
            {attendeeModel.map((participant) => {
                return isBusyTimeSlotsAvailable ? (
                    <BusyParticipantRow
                        key={participant.email}
                        attendee={participant}
                        contactEmailsMap={contactEmailsMap}
                        onToggleOptional={toggleIsOptional}
                        onDelete={onDelete}
                        onHighlight={(email, highlighted) => {
                            busyAttendeeHighlighted.current = highlighted ? email : undefined;
                            onChangeHighlight();
                        }}
                    />
                ) : (
                    <ParticipantRow
                        key={participant.email}
                        attendee={participant}
                        contactEmailsMap={contactEmailsMap}
                        onToggleOptional={toggleIsOptional}
                        onDelete={onDelete}
                    />
                );
            })}
        </div>
    );
};

export default ParticipantRows;

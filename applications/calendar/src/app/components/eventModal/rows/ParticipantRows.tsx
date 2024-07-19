import React, { useCallback, useRef } from 'react';

import debounce from 'lodash/debounce';

import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { AttendeeModel } from '@proton/shared/lib/interfaces/calendar';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { busySlotsActions } from '../../../store/busySlots/busySlotsSlice';
import { useCalendarDispatch } from '../../../store/hooks';
import BusyParticipantRow from './BusyParticipantRow';
import ParticipantRow from './ParticipantRow';

interface Props {
    attendeeModel: AttendeeModel[];
    contactEmailsMap: SimpleMap<ContactEmail>;
    isBusySlotsAvailable: boolean;
    onDelete: (attendee: AttendeeModel) => void;
    toggleIsOptional: (attendee: AttendeeModel) => void;
}

const ParticipantRows = ({
    attendeeModel,
    contactEmailsMap,
    isBusySlotsAvailable,
    onDelete,
    toggleIsOptional,
}: Props) => {
    const dispatch = useCalendarDispatch();
    const busyAttendeeHighlighted = useRef<string | undefined>(undefined);

    const onChangeHighlight = useCallback(
        debounce(() => {
            dispatch(busySlotsActions.setHighlightedAttendee(busyAttendeeHighlighted.current));
        }, 150),
        []
    );

    return (
        <div className="pt-1 border-bottom border-weak mb-1">
            {attendeeModel.map((participant) => {
                return isBusySlotsAvailable ? (
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

import React, { memo, useMemo, useRef } from 'react';
import { AddressesAutocomplete, useNotifications, Alert } from 'react-components';
import { c, msgid } from 'ttag';
import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_RSVP, ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { uniqueBy } from 'proton-shared/lib/helpers/array';
import { Address, Recipient } from 'proton-shared/lib/interfaces';
import { inputToRecipient } from 'proton-shared/lib/mail/recipient';
import {
    cleanEmail,
    normalizeEmail,
    normalizeInternalEmail,
    validateEmailAddress,
} from 'proton-shared/lib/helpers/email';
import { useContactEmailsCache } from '../../../containers/calendar/ContactEmailsProvider';

import { AttendeeModel, EventModel } from '../../../interfaces/EventModel';
import OrganizerRow from '../rows/OrganizerRow';
import ParticipantRow from '../rows/ParticipantRow';

const { REQUIRED, OPTIONAL } = ICAL_ATTENDEE_ROLE;
const { TRUE } = ICAL_ATTENDEE_RSVP;
const { NEEDS_ACTION } = ICAL_ATTENDEE_STATUS;

const emailToAttendee = (email: string): AttendeeModel => ({
    email,
    cn: email,
    role: REQUIRED,
    partstat: NEEDS_ACTION,
    rsvp: TRUE,
});

interface Props {
    value: AttendeeModel[];
    model: EventModel;
    addresses: Address[];
    id: string;
    placeholder: string;
    className?: string;
    onChange: (recipients: AttendeeModel[]) => void;
}

const ParticipantsInput = ({ className, placeholder, model, value = [], onChange, id, addresses }: Props) => {
    const numberOfParticipants = value.length;
    const anchorRef = useRef<HTMLInputElement>(null);

    const { contactEmails, contactGroups, contactEmailsMap } = useContactEmailsCache();
    const { createNotification } = useNotifications();

    const ownNormalizedEmails = useMemo(() => {
        return addresses.map(({ Email }) => normalizeInternalEmail(Email));
    }, [addresses]);

    const recipients = value.map((attendee) => {
        return inputToRecipient(attendee.email);
    });

    const recipientsSet = new Set(recipients.map(({ Address }) => normalizeEmail(Address)));

    const handleAddRecipients = (recipients: Recipient[]) => {
        const normalizedRecipients = recipients.map((recipient) => {
            const { Address } = recipient;
            return {
                recipient,
                normalizedAddress: normalizeEmail(Address),
                valid: validateEmailAddress(Address),
            };
        });
        const uniqueRecipients = uniqueBy(normalizedRecipients, ({ normalizedAddress }) => normalizedAddress);
        const newAttendees = uniqueRecipients
            .filter(({ valid, normalizedAddress }) => {
                return valid && !recipientsSet.has(normalizedAddress);
            })
            .map(({ recipient }) => {
                return emailToAttendee(recipient.Address);
            });
        if (!newAttendees.length) {
            return;
        }
        const { attendees, selfAttendees } = newAttendees.reduce<{
            attendees: AttendeeModel[];
            selfAttendees: AttendeeModel[];
        }>(
            (acc, cur) => {
                if (ownNormalizedEmails.includes(cleanEmail(cur.email, true))) {
                    acc.selfAttendees.push(cur);
                } else {
                    acc.attendees.push(cur);
                }
                return acc;
            },
            { attendees: [], selfAttendees: [] }
        );
        if (selfAttendees.length) {
            createNotification({
                type: 'error',
                text: c('Error').t`Self invitation not allowed`,
            });
        }
        if (attendees.length) {
            onChange([...attendees, ...value]);
        }
    };

    const onDelete = (recipient: AttendeeModel) => {
        onChange(value.filter((item) => recipient !== item));
    };

    const toggleIsOptional = ({ email }: AttendeeModel) => {
        onChange(
            value.map((attendee) =>
                email === attendee.email
                    ? { ...attendee, role: attendee.role === REQUIRED ? OPTIONAL : REQUIRED }
                    : attendee
            )
        );
    };

    return (
        <>
            <AddressesAutocomplete
                className={className}
                placeholder={placeholder}
                id={id}
                data-test-id="participants-input"
                ref={anchorRef}
                anchorRef={anchorRef}
                contactEmails={contactEmails}
                contactGroups={contactGroups}
                contactEmailsMap={contactEmailsMap}
                recipients={recipients}
                onAddRecipients={handleAddRecipients}
                hasEmailValidation
            />
            {numberOfParticipants > 100 && (
                <Alert className="mt0-5" type="error">
                    {c('Info').t`At most 100 participants are allowed per invitation`}
                </Alert>
            )}
            {value.length > 0 && (
                <details className="noborder mt0-25" open>
                    <summary>
                        {c('Event form').ngettext(
                            msgid`${numberOfParticipants} participant`,
                            `${numberOfParticipants} participants`,
                            numberOfParticipants
                        )}
                    </summary>
                    <div className="pt0-25">
                        {value.map((participant) => {
                            return (
                                <ParticipantRow
                                    attendee={participant}
                                    contactEmailsMap={contactEmailsMap}
                                    onToggleOptional={toggleIsOptional}
                                    onDelete={onDelete}
                                />
                            );
                        })}
                    </div>
                </details>
            )}
            {value.length > 0 && (
                <div className="pt0-25">
                    <OrganizerRow model={model} addresses={addresses} />
                </div>
            )}
        </>
    );
};

export default memo(ParticipantsInput);

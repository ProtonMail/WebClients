import { memo, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { AddressesAutocompleteTwo, Alert, Details, Summary } from '@proton/components';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { emailToAttendee } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_ROLE, MAX_ATTENDEES } from '@proton/shared/lib/calendar/constants';
import { getSelfSendAddresses } from '@proton/shared/lib/helpers/address';
import {
    CANONICALIZE_SCHEME,
    canonicalizeEmail,
    canonicalizeInternalEmail,
    validateEmailAddress,
} from '@proton/shared/lib/helpers/email';
import { Address, Recipient } from '@proton/shared/lib/interfaces';
import { AttendeeModel, OrganizerModel } from '@proton/shared/lib/interfaces/calendar';
import { inputToRecipient } from '@proton/shared/lib/mail/recipient';
import uniqueBy from '@proton/utils/uniqueBy';

import OrganizerRow from '../rows/OrganizerRow';
import ParticipantRow from '../rows/ParticipantRow';

const { REQUIRED, OPTIONAL } = ICAL_ATTENDEE_ROLE;

interface Props {
    value: AttendeeModel[];
    addresses: Address[];
    organizer?: OrganizerModel;
    id: string;
    placeholder: string;
    className?: string;
    onChange: (recipients: AttendeeModel[]) => void;
    setParticipantError?: (value: boolean) => void;
    collapsible?: boolean;
}

const ParticipantsInput = ({
    className,
    placeholder,
    organizer,
    value = [],
    onChange,
    id,
    addresses,
    setParticipantError,
    collapsible = true,
}: Props) => {
    const numberOfParticipants = value.length;

    const { contactEmails, contactGroups, contactEmailsMap, groupsWithContactsMap } = useContactEmailsCache();

    const ownNormalizedEmails = useMemo(
        () => getSelfSendAddresses(addresses).map(({ Email }) => canonicalizeInternalEmail(Email)),
        [addresses]
    );

    const recipients = value.map((attendee) => {
        return inputToRecipient(attendee.email);
    });

    const recipientsSet = new Set(recipients.map(({ Address }) => canonicalizeEmail(Address)));

    const handleAddRecipients = (recipients: Recipient[]) => {
        setParticipantError?.(false);
        const normalizedRecipients = recipients.map((recipient) => {
            const { Address } = recipient;
            return {
                recipient,
                normalizedAddress: canonicalizeEmail(Address),
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
        const attendees = newAttendees.reduce<AttendeeModel[]>((acc, cur) => {
            if (!ownNormalizedEmails.includes(canonicalizeEmail(cur.email, CANONICALIZE_SCHEME.PROTON))) {
                acc.push(cur);
            }

            return acc;
        }, []);
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

    const participantRows = (
        <div className="pt0-25">
            {value.map((participant) => {
                return (
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

    return (
        <>
            <AddressesAutocompleteTwo
                hasAddOnBlur
                className={className}
                placeholder={placeholder}
                id={id}
                data-test-id="participants-input"
                contactEmails={contactEmails}
                contactGroups={contactGroups}
                contactEmailsMap={contactEmailsMap}
                groupsWithContactsMap={groupsWithContactsMap}
                recipients={recipients}
                onAddRecipients={handleAddRecipients}
                onAddInvalidEmail={() => {
                    setParticipantError?.(true);
                }}
                onChange={(value) => {
                    if (!value.trimStart()) {
                        setParticipantError?.(false);
                    }
                }}
                validate={(email) => {
                    if (ownNormalizedEmails.includes(canonicalizeInternalEmail(email))) {
                        return c('Error').t`Self invitation not allowed`;
                    }

                    if (!validateEmailAddress(email)) {
                        return c('Error').t`Invalid email address`;
                    }
                }}
            />
            {numberOfParticipants > MAX_ATTENDEES && (
                <Alert className="mb1 mt0-5" type="error">
                    {c('Info').ngettext(
                        msgid`At most ${MAX_ATTENDEES} participant is allowed per invitation`,
                        `At most ${MAX_ATTENDEES} participants are allowed per invitation`,
                        MAX_ATTENDEES
                    )}
                </Alert>
            )}
            {value.length > 0 &&
                (collapsible ? (
                    <Details className="border-none mt0-25" open>
                        <Summary>
                            {c('Event form').ngettext(
                                msgid`${numberOfParticipants} participant`,
                                `${numberOfParticipants} participants`,
                                numberOfParticipants
                            )}
                        </Summary>
                        {participantRows}
                    </Details>
                ) : (
                    participantRows
                ))}
            {organizer && (
                <div className="pt0-25">
                    <OrganizerRow organizer={organizer} />
                </div>
            )}
        </>
    );
};

export default memo(ParticipantsInput);

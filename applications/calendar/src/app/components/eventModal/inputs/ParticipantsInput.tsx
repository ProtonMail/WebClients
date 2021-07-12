import { ICAL_ATTENDEE_ROLE } from '@proton/shared/lib/calendar/constants';
import { uniqueBy } from '@proton/shared/lib/helpers/array';
import {
    CANONIZE_SCHEME,
    canonizeEmail,
    canonizeInternalEmail,
    validateEmailAddress,
} from '@proton/shared/lib/helpers/email';
import { Address, Recipient } from '@proton/shared/lib/interfaces';
import { inputToRecipient } from '@proton/shared/lib/mail/recipient';
import { memo, useMemo, useRef } from 'react';
import { AddressesAutocomplete, Alert, Details, Summary } from '@proton/components';
import { c, msgid } from 'ttag';
import { AttendeeModel, EventModel } from '@proton/shared/lib/interfaces/calendar';
import { emailToAttendee } from '@proton/shared/lib/calendar/attendees';
import { useContactEmailsCache } from '../../../containers/calendar/ContactEmailsProvider';

import OrganizerRow from '../rows/OrganizerRow';
import ParticipantRow from '../rows/ParticipantRow';

const { REQUIRED, OPTIONAL } = ICAL_ATTENDEE_ROLE;

interface Props {
    value: AttendeeModel[];
    model: EventModel;
    addresses: Address[];
    id: string;
    placeholder: string;
    className?: string;
    onChange: (recipients: AttendeeModel[]) => void;
    setParticipantError?: (value: boolean) => void;
}

const ParticipantsInput = ({
    className,
    placeholder,
    model,
    value = [],
    onChange,
    id,
    addresses,
    setParticipantError,
}: Props) => {
    const numberOfParticipants = value.length;
    const anchorRef = useRef<HTMLInputElement>(null);

    const { contactEmails, contactGroups, contactEmailsMap, groupsWithContactsMap } = useContactEmailsCache();

    const ownNormalizedEmails = useMemo(
        () =>
            addresses
                // For custom domains, ProtonMail allows to have multiple sub-users with the same email address
                // as long as only one of them is enabled. This poses problems when a sub-user
                // with a disabled address wants to send email to the same address enabled in another sub-user.
                // Because of this case, it's better to consider disabled addresses as non self,
                // as we already do this when getting encryption preferences
                .filter(({ Receive }) => !!Receive)
                .map(({ Email }) => canonizeInternalEmail(Email)),
        [addresses]
    );

    const recipients = value.map((attendee) => {
        return inputToRecipient(attendee.email);
    });

    const recipientsSet = new Set(recipients.map(({ Address }) => canonizeEmail(Address)));

    const handleAddRecipients = (recipients: Recipient[]) => {
        setParticipantError?.(false);
        const normalizedRecipients = recipients.map((recipient) => {
            const { Address } = recipient;
            return {
                recipient,
                normalizedAddress: canonizeEmail(Address),
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
            if (!ownNormalizedEmails.includes(canonizeEmail(cur.email, CANONIZE_SCHEME.PROTON))) {
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

    return (
        <>
            <AddressesAutocomplete
                hasAddOnBlur
                className={className}
                placeholder={placeholder}
                id={id}
                data-test-id="participants-input"
                ref={anchorRef}
                anchorRef={anchorRef}
                contactEmails={contactEmails}
                contactGroups={contactGroups}
                contactEmailsMap={contactEmailsMap}
                groupsWithContactsMap={groupsWithContactsMap}
                recipients={recipients}
                onAddRecipients={handleAddRecipients}
                onAddInvalidEmail={() => {
                    setParticipantError?.(true);
                }}
                onChange={(event) => {
                    if (!event.currentTarget.value.trimStart()) {
                        setParticipantError?.(false);
                    }
                }}
                validate={(email) => {
                    if (ownNormalizedEmails.includes(canonizeInternalEmail(email))) {
                        return c('Error').t`Self invitation not allowed`;
                    }

                    if (!validateEmailAddress(email)) {
                        return c('Error').t`Invalid email address`;
                    }
                }}
            />
            {numberOfParticipants > 100 && (
                <Alert className="mt0-5" type="error">
                    {c('Info').t`At most 100 participants are allowed per invitation`}
                </Alert>
            )}
            {value.length > 0 && (
                <Details className="no-border mt0-25" open>
                    <Summary>
                        {c('Event form').ngettext(
                            msgid`${numberOfParticipants} participant`,
                            `${numberOfParticipants} participants`,
                            numberOfParticipants
                        )}
                    </Summary>
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
                </Details>
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

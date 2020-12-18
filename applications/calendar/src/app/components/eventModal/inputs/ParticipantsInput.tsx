import React, { ComponentProps, memo, useMemo, useRef } from 'react';
import { classnames, Icon, Input, useContactEmails, useContactGroups, AddressesAutocomplete } from 'react-components';
import { c, msgid } from 'ttag';
import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_RSVP, ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { toMap } from 'proton-shared/lib/helpers/object';
import { Recipient } from 'proton-shared/lib/interfaces';
import { inputToRecipient } from 'proton-shared/lib/mail/recipient';
import { normalizeEmail, validateEmailAddress } from 'proton-shared/lib/helpers/email';

import { AttendeeModel } from '../../../interfaces/EventModel';

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
    onChange: (recipients: AttendeeModel[]) => void;
    value: AttendeeModel[];
}

const ParticipantsInput = ({
    className,
    placeholder,
    value = [],
    onChange,
    id,
    ...props
}: Props & Omit<ComponentProps<typeof Input>, 'onChange' | 'value'>) => {
    const numberOfParticipants = value.length;
    const anchorRef = useRef<HTMLInputElement>(null);

    const [contactEmails] = useContactEmails() as [ContactEmail[] | undefined, boolean, any];
    const [contactGroups] = useContactGroups();

    const contactEmailsMap = useMemo(() => {
        return toMap(contactEmails, 'Email');
    }, [contactEmails]);

    const recipients = value.map((attendee) => {
        return inputToRecipient(attendee.email);
    });

    const recipientsSet = new Set(recipients.map(({ Address }) => normalizeEmail(Address)));

    const handleAddRecipients = (recipients: Recipient[]) => {
        const newAttendees: AttendeeModel[] = recipients
            .filter(({ Address }) => {
                return Address && validateEmailAddress(Address) && !recipientsSet.has(normalizeEmail(Address));
            })
            .map((recipient) => emailToAttendee(recipient.Address as string));
        if (!newAttendees.length) {
            return;
        }
        onChange([...newAttendees, ...value]);
    };

    const onDelete = (recipient: AttendeeModel) => {
        onChange(value.filter((item) => recipient !== item));
    };

    const setIsOptional = ({ email }: AttendeeModel) => {
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
                id="participants-input"
                data-test-id="participants-input"
                {...props}
                ref={anchorRef}
                anchorRef={anchorRef}
                contactEmails={contactEmails}
                contactGroups={contactGroups}
                contactEmailsMap={contactEmailsMap}
                recipients={recipients}
                onAddRecipients={handleAddRecipients}
                hasEmailValidation
            />

            {value.length > 0 && (
                <details className="mt0-25" open>
                    <summary>
                        {c('Event form').ngettext(
                            msgid`${numberOfParticipants} participant`,
                            `${numberOfParticipants} participants`,
                            numberOfParticipants
                        )}
                    </summary>
                    <div className="pt0-25">
                        {value.map((recipient) => {
                            const isOptional = recipient.role === ICAL_ATTENDEE_ROLE.OPTIONAL;
                            const contact = recipient.email && contactEmailsMap[recipient.email];
                            return (
                                <div
                                    key={recipient.email}
                                    className={classnames(['address-item flex mb0-25 pl0-5 pr0-5'])}
                                >
                                    <div
                                        className="flex flex-item-fluid p0-5"
                                        title={contact ? `${contact.Name} <${contact.Email}>` : recipient.email}
                                    >
                                        {contact ? (
                                            <>
                                                <div className="mw50 ellipsis">{contact.Name}</div>
                                                <div className="mw50 ellipsis">
                                                    {' <'}
                                                    {contact.Email}
                                                    {'>'}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="mw100 ellipsis">{recipient.email}</div>
                                        )}
                                        {isOptional ? (
                                            <span className="color-subheader w100">{c('Label').t`Optional`}</span>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        className="flex flex-item-noshrink p0-5"
                                        onClick={() => setIsOptional(recipient)}
                                        title={c('Label').t`Optional`}
                                    >
                                        <Icon name={isOptional ? 'contact' : 'contact-full'} size={12} />
                                        <span className="sr-only">{c('Label').t`Optional`}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="flex flex-item-noshrink p0-5"
                                        onClick={() => onDelete(recipient)}
                                        title={c('Action').t`Remove`}
                                    >
                                        <Icon name="close" size={12} />
                                        <span className="sr-only">{c('Action').t`Remove`}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </details>
            )}
        </>
    );
};

export default memo(ParticipantsInput);

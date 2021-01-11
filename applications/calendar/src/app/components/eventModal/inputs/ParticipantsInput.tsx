import React, { memo, useMemo, useRef } from 'react';
import {
    LinkButton,
    Tooltip,
    classnames,
    Icon,
    useContactEmails,
    useContactGroups,
    AddressesAutocomplete,
} from 'react-components';
import { c, msgid } from 'ttag';
import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_RSVP, ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces';
import { uniqueBy } from 'proton-shared/lib/helpers/array';
import { inputToRecipient } from 'proton-shared/lib/mail/recipient';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
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
    className?: string;
    placeholder: string;
    id: string;
}

const ParticipantsInput = ({ className, placeholder, value = [], onChange, id }: Props) => {
    const numberOfParticipants = value.length;
    const anchorRef = useRef<HTMLInputElement>(null);

    const [contactEmails] = useContactEmails() as [ContactEmail[] | undefined, boolean, any];
    const [contactGroups] = useContactGroups();

    const contactEmailsMap = useMemo(() => {
        return (contactEmails || []).reduce<SimpleMap<ContactEmail>>((acc, cur) => {
            const { Email } = cur;
            if (!acc[Email]) {
                acc[Email] = cur;
            }
            return acc;
        }, {});
    }, [contactEmails]);

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
                                    <Tooltip
                                        title={
                                            isOptional
                                                ? c('Action').t`Make this participant required`
                                                : c('Action').t`Make this participant optional`
                                        }
                                        className="w2e flex flex-item-noshrink"
                                    >
                                        <LinkButton
                                            type="button"
                                            className="w2e flex flex-item-noshrink"
                                            onClick={() => setIsOptional(recipient)}
                                        >
                                            <Icon name={isOptional ? 'contact' : 'contact-full'} className="mauto" />
                                            <span className="sr-only">
                                                {isOptional
                                                    ? c('Action').t`Make this participant required`
                                                    : c('Action').t`Make this participant optional`}
                                            </span>
                                        </LinkButton>
                                    </Tooltip>
                                    <Tooltip
                                        title={c('Action').t`Remove this participant`}
                                        className="w2e flex flex-item-noshrink ml0-5"
                                    >
                                        <LinkButton
                                            type="button"
                                            className="w2e flex flex-item-noshrink"
                                            onClick={() => onDelete(recipient)}
                                        >
                                            <Icon name="trash" className="mauto" />
                                            <span className="sr-only">{c('Action').t`Remove this participant`}</span>
                                        </LinkButton>
                                    </Tooltip>
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

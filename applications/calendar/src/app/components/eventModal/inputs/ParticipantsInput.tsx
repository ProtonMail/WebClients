import { memo, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AddressesAutocompleteTwo,
    Alert,
    Details,
    Icon,
    Summary,
    useBusySlotsAvailable,
    useContactEmailsCache,
} from '@proton/components';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { emailToAttendee } from '@proton/shared/lib/calendar/attendees';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import { ICAL_ATTENDEE_ROLE } from '@proton/shared/lib/calendar/constants';
import { getSelfSendAddresses } from '@proton/shared/lib/helpers/address';
import {
    CANONICALIZE_SCHEME,
    canonicalizeEmail,
    canonicalizeInternalEmail,
    validateEmailAddress,
} from '@proton/shared/lib/helpers/email';
import type { Address, Recipient } from '@proton/shared/lib/interfaces';
import type { AttendeeModel, OrganizerModel } from '@proton/shared/lib/interfaces/calendar';
import { inputToRecipient } from '@proton/shared/lib/mail/recipient';
import uniqueBy from '@proton/utils/uniqueBy';

import { selectDisplayAvailabilityUnknown } from '../../../store/busySlots/busySlotsSelectors';
import { useCalendarSelector } from '../../../store/hooks';
import { getParticipantsError } from '../helpers';
import OrganizerRow from '../rows/OrganizerRow';
import ParticipantRows from '../rows/ParticipantRows';

const { REQUIRED, OPTIONAL } = ICAL_ATTENDEE_ROLE;

interface Props {
    value: AttendeeModel[];
    isOwnedCalendar: boolean;
    addresses: Address[];
    organizer?: OrganizerModel;
    displayBusySlots: boolean;
    id: string;
    placeholder: string;
    className?: string;
    onChange: (recipients: AttendeeModel[]) => void;
    setParticipantError?: (value: boolean) => void;
    collapsible?: boolean;
    onDisplayBusySlots?: () => void;
    view: VIEWS;
}

const ParticipantsInput = ({
    className,
    placeholder,
    displayBusySlots,
    organizer,
    value = [],
    isOwnedCalendar,
    onChange,
    id,
    addresses,
    setParticipantError,
    collapsible = true,
    onDisplayBusySlots,
    view,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const isBusySlotsAvailable = useBusySlotsAvailable(view);
    const displayAvailabilityUnknown = useCalendarSelector(selectDisplayAvailabilityUnknown) && displayBusySlots;
    const numberOfAttendees = value.length;

    const { contactEmails, contactGroups, contactEmailsMap, groupsWithContactsMap } = useContactEmailsCache();

    const ownNormalizedEmails = useMemo(
        () => getSelfSendAddresses(addresses).map(({ Email }) => canonicalizeInternalEmail(Email)),
        [addresses]
    );

    const recipients = value.map((attendee) => {
        return inputToRecipient(attendee.email);
    });

    const recipientsSet = new Set(recipients.map(({ Address }) => canonicalizeEmail(Address)));

    const error = getParticipantsError({
        isOwnedCalendar,
        numberOfAttendees,
        maxAttendees: mailSettings?.RecipientLimit,
    });

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
        <ParticipantRows
            attendeeModel={value}
            contactEmailsMap={contactEmailsMap}
            isBusySlotsAvailable={isBusySlotsAvailable && displayBusySlots}
            onDelete={onDelete}
            toggleIsOptional={toggleIsOptional}
        />
    );

    return (
        <>
            <AddressesAutocompleteTwo
                hasAddOnBlur
                className={className}
                placeholder={placeholder}
                id={id}
                data-testid="participants-input"
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
            {error && (
                <Alert className="mb-4 mt-2" type="error">
                    {error}
                </Alert>
            )}
            {numberOfAttendees > 0 &&
                (collapsible ? (
                    <Details className="border-none mt-1" open>
                        <Summary>
                            {c('Event form').ngettext(
                                msgid`${numberOfAttendees} participant`,
                                `${numberOfAttendees} participants`,
                                numberOfAttendees
                            )}
                        </Summary>
                        {participantRows}
                    </Details>
                ) : (
                    participantRows
                ))}
            {numberOfAttendees > 0 && organizer && <OrganizerRow organizer={organizer} />}
            {isBusySlotsAvailable && displayAvailabilityUnknown && (
                <div
                    className="flex items-center color-weak mt-2 text-sm bg-weak rounded py-1 px-2"
                    data-testid="availability-unknown-banner"
                >
                    <Icon name="circle-half-filled" size={2.5} className="rotateZ-45 opacity-70 mr-2" />{' '}
                    {c('Description').t`Availability unknown`}
                </div>
            )}
            {isBusySlotsAvailable && !!onDisplayBusySlots && (
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDisplayBusySlots();
                    }}
                    shape="underline"
                    color="norm"
                    type="button"
                >
                    {c('Action').t`Show busy times`}
                </Button>
            )}
        </>
    );
};

export default memo(ParticipantsInput);

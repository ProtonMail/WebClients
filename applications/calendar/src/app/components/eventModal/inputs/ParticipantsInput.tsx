/* eslint-disable jsx-a11y/control-has-associated-label */
import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_RSVP, ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { contactToRecipient } from 'proton-shared/lib/helpers/address';
import { majorDomainsMatcher, normalizeExternalEmail, validateEmailAddress } from 'proton-shared/lib/helpers/email';
import { Recipient } from 'proton-shared/lib/interfaces';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import React, { ChangeEvent, ComponentProps, memo, useCallback, useMemo, useState } from 'react';
import {
    classnames,
    generateUID,
    Icon,
    Input,
    LinkButton,
    useAutocompleteAriaProps,
    useContactEmails,
    useContactGroups,
    useSearch,
} from 'react-components';
import { c, msgid } from 'ttag';
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

function isContactGroup(item: Recipient | ContactGroup): item is ContactGroup {
    return (item as ContactGroup).Color !== undefined;
}
function isRecipient(item: Recipient | ContactGroup): item is Recipient {
    return (item as Recipient).Address !== undefined;
}

const ParticipantInput = ({
    className,
    placeholder,
    value = [],
    onChange,
    id,
    ...props
}: Props & Omit<ComponentProps<typeof Input>, 'onChange' | 'value'>) => {
    const [uid] = useState(generateUID('participant-input'));
    const [inputValue, setInputValue] = useState('');
    const uniqueEmails = value.map(({ email }) => normalizeExternalEmail(email));
    const numberOfParticipants = value.length;

    const contacts = (useContactEmails()[0] as ContactEmail[]) || [];
    const [contactGroups = []] = useContactGroups();
    const recipientContacts = useMemo(() => contacts.map((contact) => contactToRecipient(contact)), [contacts]);
    const groupedContacts = useMemo(() => {
        return contacts.reduce((acc, contact) => {
            const { LabelIDs = [] } = contact;
            for (const group of LabelIDs) {
                if (!Array.isArray(acc[group])) {
                    acc[group] = [];
                }
                acc[group].push(contactToRecipient(contact));
            }
            return acc;
        }, {} as { [P: string]: Recipient[] });
    }, [contacts, contactGroups]);
    const contactDict = useMemo(() => {
        return contacts.reduce<{ [email: string]: ContactEmail }>((acc, item) => {
            if (!acc[item.Email]) {
                acc[item.Email] = item;
            }
            return acc;
        }, {});
    }, [contacts]);
    const uniqueEmailsInContacts = useMemo(
        () => Object.keys(contactDict).map((email) => normalizeExternalEmail(email)),
        [contactDict]
    );

    const isUniqueEmail = useCallback((email?: string, ...sources: string[][]) => {
        if (!email) {
            return false;
        }
        const normalizedEmail = normalizeExternalEmail(email);
        return sources.every((source) => !source.includes(normalizedEmail));
    }, []);
    const filterByUniqueEmail = useCallback(
        (items: AttendeeModel[]) => {
            return items.reduce<{ attendees: AttendeeModel[]; emails: string[] }>(
                ({ attendees, emails }, item) => {
                    if (isUniqueEmail(item.email, uniqueEmails, emails)) {
                        return { attendees: [...attendees, item], emails: [...emails, item.email] };
                    }
                    return { attendees, emails };
                },
                { attendees: [], emails: [] }
            ).attendees;
        },
        [uniqueEmails]
    );
    const appendValue = useCallback(
        (item: AttendeeModel | AttendeeModel[]) => {
            let newItems = Array.isArray(item) ? item : [item];
            newItems = newItems.filter(({ email }) => isUniqueEmail(email, uniqueEmails));
            onChange([...filterByUniqueEmail(newItems), ...value]);
        },
        [onChange, uniqueEmails, value]
    );
    const onSelect = useCallback(
        (item: Recipient | ContactGroup) => {
            let newItems;
            if (isContactGroup(item)) {
                newItems = groupedContacts[item.ID];
            }
            if (isRecipient(item)) {
                newItems = [item];
            }
            if (newItems) {
                appendValue(newItems.map(({ Address }) => emailToAttendee(Address!)));
            }
        },
        [onChange, appendValue]
    );
    const onSubmit = useCallback((email: string) => appendValue(emailToAttendee(email)), [onChange, appendValue]);
    const onDelete = useCallback((recipient: AttendeeModel) => onChange(value.filter((item) => recipient !== item)), [
        onChange,
        value,
    ]);
    const setIsOptional = useCallback(
        ({ email }: AttendeeModel) => {
            onChange(
                value.map((attendee) =>
                    email === attendee.email
                        ? { ...attendee, role: attendee.role === REQUIRED ? OPTIONAL : REQUIRED }
                        : attendee
                )
            );
        },
        [value, onChange]
    );

    const { inputProps, searchSuggestions, selectedSuggest, parentProps, error, datalistProps, itemProps } = useSearch<
        Recipient | ContactGroup
    >({
        inputValue,
        keys: ['Address', 'Name'],
        sources: [
            () => recipientContacts,
            () => contactGroups,
            (inputVal: string) =>
                majorDomainsMatcher(inputVal).filter(({ Address }) => {
                    return isUniqueEmail(Address, uniqueEmailsInContacts, uniqueEmails);
                }),
        ],
        onSelect,
        onSubmit,
        resetField: () => setInputValue(''),
        validate: (inputValue) => {
            if (!validateEmailAddress(inputValue)) {
                throw new Error(c('Error').t`Invalid email address`);
            }
        },
        mapFn: (items) =>
            items.filter(({ Address, ID }) => {
                if (Address) {
                    return isUniqueEmail(Address, uniqueEmails);
                }
                if (ID) {
                    return groupedContacts[ID!]?.length;
                }
                return false;
            }),
    });
    const {
        inputAriaProps,
        suggestionsAriaProps,
        helpText,
        getAriaPropsForOption,
        getNumberHelpText,
    } = useAutocompleteAriaProps({
        baseId: id || uid,
        selectedSuggest,
    });

    return (
        <>
            <div {...parentProps}>
                {helpText}
                {getNumberHelpText(searchSuggestions.length)}
                <Input
                    className={className}
                    placeholder={placeholder}
                    data-test-id="participants-input"
                    value={inputValue}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setInputValue(event.currentTarget.value)}
                    error={error || undefined}
                    {...props}
                    {...inputProps}
                    {...inputAriaProps}
                />
                <datalist {...datalistProps} {...suggestionsAriaProps}>
                    {searchSuggestions.map(({ item, matchedProps: { Name, Address }, key, onClick }, idx) => {
                        const title = `${item.Name} ${
                            isRecipient(item) && item.Address !== undefined && item.Address !== item.Name
                                ? ` <${item.Address}>`
                                : ''
                        }`;
                        return (
                            // the only reason this div is here is because setting pr0-5 on button doesn't have any effect
                            <div
                                className={classnames(['pl0-5 pr0-5', idx === selectedSuggest && 'selected'])}
                                key={key}
                                title={title}
                                {...getAriaPropsForOption(idx)}
                                {...itemProps[idx]}
                            >
                                <LinkButton className="nodecoration alignleft w100 ellipsis" {...{ onClick }}>
                                    {Name || item.Name}
                                    {isRecipient(item) && item.Address !== undefined && item.Address !== item.Name ? (
                                        <>
                                            {' <'}
                                            {Address || item.Address}
                                            {'>'}
                                        </>
                                    ) : null}
                                    {isContactGroup(item) ? ` (${groupedContacts[item.ID]?.length})` : null}
                                </LinkButton>
                            </div>
                        );
                    })}
                </datalist>
            </div>
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
                            const contact = recipient.email && contactDict[recipient.email];
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

export default memo(ParticipantInput);

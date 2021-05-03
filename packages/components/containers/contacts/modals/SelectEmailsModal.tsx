import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';

import { Contact, ContactEmail } from 'proton-shared/lib/interfaces/contacts';

import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import useContactEmails from '../../../hooks/useContactEmails';
import { FormModal, Alert, Row, Label, Field, Checkbox } from '../../../components';
import { useContactGroups } from '../../../hooks';

const enumerate = (names: string[]) => {
    if (names.length <= 1) {
        return names.join('');
    }

    const namesWithoutLast = names.slice(0, -1).join(', ');
    const nameOfLast = names.slice(-1);
    // translator: ${namesWithoutLast} variables contains the list of contact or groups names separated by ", " and ${nameOfLast} is the last name of the list. Ex: contact1, contact2 and contact3
    return c('Info').t`${namesWithoutLast} and ${nameOfLast}`;
};

interface Props {
    groupIDs: string[];
    contacts: Contact[];
    onSubmit: (value: ContactEmail[]) => void;
    onClose: () => void;
}

type CheckableContact = ContactEmail & { isChecked?: boolean };

/**
 * Modal to select contact emails and add them to a contact group
 * @param contacts contacts selected
 * @param onSubmit only submit checked contactEmails (Array<Object>)
 * @param onClose
 */
const SelectEmailsModal = ({ contacts, groupIDs, onSubmit, onClose, ...rest }: Props) => {
    const [contactGroups] = useContactGroups();
    const [contactEmails] = useContactEmails();

    const groups = groupIDs.map((groupID) => contactGroups?.find((group) => group.ID === groupID)).filter(isTruthy);

    const [model, setModel] = useState(
        contacts.map((contact) => {
            return {
                ...contact,
                contactEmails: contactEmails
                    .filter(({ ContactID }: ContactEmail) => ContactID === contact.ID)
                    .map((contactEmail: ContactEmail) => ({ ...contactEmail, isChecked: true })),
            };
        })
    );

    const handleSubmit = () => {
        const toSubmit = model.reduce((acc, contact) => {
            contact.contactEmails.forEach(({ isChecked, ...contactEmail }: CheckableContact) => {
                if (isChecked) {
                    acc.push(contactEmail);
                }
            });
            return acc;
        }, [] as CheckableContact[]);
        onSubmit(toSubmit);
        onClose?.();
    };

    const handleCheck = (contactID: string, contactEmailID: string) => ({ target }: ChangeEvent<HTMLInputElement>) => {
        const copy = [...model];
        const contactIndex = model.findIndex(({ ID }) => ID === contactID);
        const contactEmailIndex = model[contactIndex].contactEmails.findIndex(
            ({ ID }: ContactEmail) => ID === contactEmailID
        );
        copy[contactIndex].contactEmails[contactEmailIndex].isChecked = target.checked;
        setModel(copy);
    };

    const isSingleContact = contacts.length === 1;
    const isSingleGroup = groups.length === 1;

    const contactName = contacts[0].Name;
    const contactsEnumeration = enumerate(contacts.map((contact) => contact.Name));
    const groupName = groups[0].Name;
    const groupsEnumeration = enumerate(groups.map((group) => group.Name));
    const groupCount = groups.length;

    const title = isSingleGroup ? c('Title').t`Add to ${groupName}` : c('Title').t`Add to ${groupCount} groups`;

    let text: string;
    if (isSingleContact) {
        if (isSingleGroup) {
            text = c('Info')
                .t`${contactName} contains multiple email addresses. Please select which email address or addresses to add to this group.`;
        } else {
            // translator: ${groupsEnumeration} is the enumeration of a list of groups. Ex: group1, group2 and group3
            text = c('Info')
                .t`${contactName} contains multiple email addresses. Please select which email address or addresses to add to ${groupsEnumeration}.`;
        }
    } else if (isSingleGroup) {
        // translator: ${contactsEnumeration} is the enumeration of a list of contacts. Ex: contact1, contact2 and contact3
        text = c('Info')
            .t`${contactsEnumeration} contain multiple email addresses. Please select which email address or addresses to add to this group.`;
    } else {
        // translator: ${contactsEnumeration} and ${groupsEnumeration} are the enumeration of lists of contacts and groups. Ex: contact1, contact2 and contact3
        text = c('Info')
            .t`${contactsEnumeration} contain multiple email addresses. Please select which email address or addresses to add to ${groupsEnumeration}.`;
    }

    return (
        <FormModal submit={c('Action').t`Apply`} title={title} onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <Alert>{text}</Alert>
            {model
                .filter(({ contactEmails = [] }) => contactEmails.length > 1) // Only display contact with multiple emails
                .map(({ ID: contactID, Name, contactEmails = [] }) => {
                    return (
                        <Row key={contactID} className="border-bottom">
                            {!isSingleContact && <Label className="text-semibold pt0">{Name}</Label>}
                            <Field className="flex flex-column w100">
                                {contactEmails.map(({ ID: contactEmailID, Email, isChecked }: CheckableContact) => {
                                    return (
                                        <label key={contactEmailID} className="mb1" htmlFor={contactEmailID}>
                                            <Checkbox
                                                id={contactEmailID}
                                                checked={isChecked}
                                                className="mr0-5"
                                                onChange={handleCheck(contactID, contactEmailID)}
                                            />
                                            <span>{Email}</span>
                                        </label>
                                    );
                                })}
                            </Field>
                        </Row>
                    );
                })}
        </FormModal>
    );
};

export default SelectEmailsModal;

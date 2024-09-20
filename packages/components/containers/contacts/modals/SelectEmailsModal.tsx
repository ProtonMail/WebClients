import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Checkbox from '@proton/components/components/input/Checkbox';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { Contact, ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import isTruthy from '@proton/utils/isTruthy';

import { Label } from '../../../components';
import Field from '../../../components/container/Field';
import Row from '../../../components/container/Row';
import { useContactGroups } from '../../../hooks';
import useContactEmails from '../../../hooks/useContactEmails';

export interface SelectEmailsProps {
    groupIDs: string[];
    // contacts selected
    contacts: Contact[];
    onLock?: (lock: boolean) => void;
}

interface SelectEmailsResolver {
    // only submit checked contactEmails (Array<Object>)
    onResolve: (value: ContactEmail[]) => void;
    onReject: () => void;
}

type Props = SelectEmailsProps & SelectEmailsResolver & ModalProps;

type CheckableContact = ContactEmail & { isChecked?: boolean };

/**
 * Modal to select contact emails and add them to a contact group
 */
const SelectEmailsModal = ({ contacts, groupIDs, onSubmit, onLock, onResolve, onReject, ...rest }: Props) => {
    const [contactGroups] = useContactGroups();
    const [allContactEmails = []] = useContactEmails();

    const groups = groupIDs.map((groupID) => contactGroups?.find((group) => group.ID === groupID)).filter(isTruthy);

    useEffect(() => {
        onLock?.(true);
        return () => onLock?.(false);
    }, []);

    const [model, setModel] = useState(
        contacts.map((contact) => {
            const contactEmails: CheckableContact[] = allContactEmails
                .filter(({ ContactID }) => ContactID === contact.ID)
                .map((contactEmail) => ({
                    ...contactEmail,
                    // isChecked by default if the email has already all groups
                    isChecked: groups.every((group) => contactEmail.LabelIDs.includes(group.ID)),
                }));

            // If none are checked, check the first one by default
            const noneChecked = contactEmails.every((contactEmail) => contactEmail.isChecked === false);
            if (noneChecked && contactEmails.length > 0) {
                contactEmails[0].isChecked = true;
            }

            return { ...contact, contactEmails };
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
        onResolve(toSubmit);
        rest.onClose?.();
    };

    const handleCheck =
        (contactID: string, contactEmailID: string) =>
        ({ target }: ChangeEvent<HTMLInputElement>) => {
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
    const contactCount = contacts.length;
    const groupName = groups[0].Name;
    const groupCount = groups.length;

    const title = isSingleGroup
        ? c('Title').t`Add to ${groupName}`
        : c('Title').ngettext(msgid`Add to ${groupCount} group`, `Add to ${groupCount} groups`, groupCount);

    const contactText = isSingleContact
        ? c('Info').t`${contactName} contains multiple email addresses.`
        : // "<number> contacts contain..." The singular will not be used, the contact name will be used instead
          c('Info').ngettext(
              msgid`${contactCount} contact contains multiple email addresses.`,
              `${contactCount} contacts contain multiple email addresses.`,
              contactCount
          );

    const groupText = isSingleGroup
        ? c('Info').t`Please select which email address or addresses to add to ${groupName}.`
        : // "... to add to <number> groups" The singular will not be used, the group name will be used instead
          c('Info').ngettext(
              msgid`Please select which email address or addresses to add to ${groupCount} group.`,
              `Please select which email address or addresses to add to ${groupCount} groups.`,
              groupCount
          );

    return (
        <ModalTwo size="large" {...rest}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <Alert className="mb-4">
                    {contactText}
                    <br />
                    {groupText}
                </Alert>
                {model
                    .filter(({ contactEmails = [] }) => contactEmails.length > 1) // Only display contact with multiple emails
                    .map(({ ID: contactID, Name, contactEmails = [] }) => {
                        return (
                            <Row key={contactID} className="border-bottom">
                                {!isSingleContact && <Label className="text-semibold pt-0">{Name}</Label>}
                                <Field className="flex flex-column w-full">
                                    {contactEmails.map(({ ID: contactEmailID, Email, isChecked }: CheckableContact) => {
                                        return (
                                            <label key={contactEmailID} className="mb-4" htmlFor={contactEmailID}>
                                                <Checkbox
                                                    id={contactEmailID}
                                                    checked={isChecked}
                                                    className="mr-2"
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" onClick={handleSubmit}>{c('Action').t`Apply`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SelectEmailsModal;

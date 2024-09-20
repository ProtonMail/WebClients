import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useLoading } from '@proton/hooks';
import {
    addVCardProperty,
    getSortedProperties,
    getVCardProperties,
    removeVCardProperty,
    updateVCardContact,
} from '@proton/shared/lib/contacts/properties';
import { isContactNameValid, isFirstLastNameValid } from '@proton/shared/lib/contacts/property';
import { prepareForEdition } from '@proton/shared/lib/contacts/surgery';
import { isMultiValue } from '@proton/shared/lib/contacts/vcard';
import { getOtherInformationFields } from '@proton/shared/lib/helpers/contacts';
import { canonicalizeEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { ContactEmailModel } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { VCardContact, VCardProperty, VcardNValue } from '@proton/shared/lib/interfaces/contacts/VCard';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import isTruthy from '@proton/utils/isTruthy';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { useContactEmails, useEventManager, useHandler, useNotifications } from '../../../hooks';
import type { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import useApplyGroups from '../hooks/useApplyGroups';
import { useSaveVCardContact } from '../hooks/useSaveVCardContact';
import type { ContactGroupLimitReachedProps } from '../modals/ContactGroupLimitReachedModal';
import type { ContactImageProps } from '../modals/ContactImageModal';
import ContactEditProperties from './ContactEditProperties';
import ContactEditProperty from './ContactEditProperty';

const otherInformationFields = getOtherInformationFields().map(({ value }) => value);

export interface ContactEditProps {
    contactID?: string;
    vCardContact?: VCardContact;
    newField?: string;
}

export interface ContactEditModalProps {
    onUpgrade: () => void;
    onChange?: () => void;
    onSelectImage: (props: ContactImageProps) => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onLimitReached: (props: ContactGroupLimitReachedProps) => void;
}

type Props = ContactEditProps & ContactEditModalProps & ModalProps;

const ContactEditModal = ({
    contactID,
    vCardContact: inputVCardContact = { fn: [] },
    newField,
    onUpgrade,
    onChange,
    onSelectImage,
    onGroupEdit,
    onLimitReached,
    ...rest
}: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [vCardContact, setVCardContact] = useState<VCardContact>(prepareForEdition(inputVCardContact));

    const displayNameFieldRef = useRef<HTMLInputElement>(null);
    const firstNameFieldRef = useRef<HTMLInputElement>(null);
    const [contactEmails = [], loadingContactEmails] = useContactEmails();
    const [modelContactEmails, setModelContactEmails] = useState<SimpleMap<ContactEmailModel>>({});

    const saveVCardContact = useSaveVCardContact();
    const { applyGroups, contactGroupLimitReachedModal } = useApplyGroups();
    const title = contactID ? c('Title').t`Edit contact` : c('Title').t`Create contact`;

    const displayNameProperty = getSortedProperties(vCardContact, 'fn')[0] as VCardProperty<string>;
    const nameProperty = getSortedProperties(vCardContact, 'n')[0] as VCardProperty<VcardNValue>;
    const photoProperty = getSortedProperties(vCardContact, 'photo')[0] as VCardProperty<string>;

    const getContactEmail = (email: string) => {
        return contactEmails.find((contactEmail) => {
            if (contactID) {
                return (
                    contactEmail.ContactID === contactID &&
                    canonicalizeEmail(contactEmail.Email) === canonicalizeEmail(email)
                );
            }
            // If the contact did not exist before adding contact group to of his addresses, contactID is not defined, and we have no ways to get it.
            // If we rely on thi contactID, adding contact groups would become impossible.
            // => To avoid adding to the wrong contact, check the contact name + the email instead
            // This is still not perfect, because creating a new contact with the same name and same address than a one existing
            // might (depending on the first one found in the list) add the group to the older contact.
            // That's a super rare case, so I will suggest to live with this "bug"
            // ---
            // We also need to trim the value, contactEmails names are trimmed when we save a new contact, but we might have an extra space in the input
            return (
                displayNameProperty.value.trim() === contactEmail.Name &&
                canonicalizeEmail(contactEmail.Email) === canonicalizeEmail(email)
            );
        });
    };

    useEffect(() => {
        if (loadingContactEmails) {
            return;
        }

        const newModelContactEmails = { ...modelContactEmails };

        const emails = vCardContact.email || [];
        const displayName = displayNameProperty.value;
        const givenName = vCardContact?.n?.value.givenNames.join(' ').trim() || '';
        const familyName = vCardContact?.n?.value.familyNames.join(' ').trim() || '';
        const computedName = `${givenName} ${familyName}`;

        // The name can either be the display name, or the computed name if we're creating a new contact
        const Name = contactID ? displayName : displayName || computedName;

        emails.forEach((emailProperty) => {
            const uid = emailProperty.uid;
            const email = emailProperty.value || '';

            const existingModel = Object.values(newModelContactEmails).find(
                (contactEmail) => contactEmail?.uid === uid
            );

            if (existingModel) {
                if (existingModel.Email !== email) {
                    const oldEmail = existingModel.Email;
                    newModelContactEmails[email] = {
                        ...existingModel,
                        Email: email,
                        Name,
                    };
                    delete newModelContactEmails[oldEmail];
                }
                return;
            }

            const existingContactEmail = getContactEmail(email);

            if (existingContactEmail) {
                newModelContactEmails[email] = {
                    ...existingContactEmail,
                    uid,
                    changes: {},
                    Name,
                };
                return;
            }

            newModelContactEmails[email] = {
                uid,
                changes: {},
                Email: email,
                ContactID: contactID || '',
                LabelIDs: [],
                Name,
            };
        });

        setModelContactEmails(newModelContactEmails);
    }, [loadingContactEmails, vCardContact.email]);

    // The condition defining if the form is valid is different if we are editing an existing contact or creating a new one
    // In all cases we want to make sure that all emails are correct
    const isFormValid = () => {
        const allEmailsAddress = vCardContact.email?.map((emailProperty) => emailProperty.value).filter(isTruthy) ?? [];

        // Check if all present address are valid email addresses
        if (!allEmailsAddress.every((email) => validateEmailAddress(email))) {
            return false;
        }

        const displayName = displayNameProperty.value.trim();

        const givenName = nameProperty.value.givenNames[0].trim();
        const familyName = nameProperty.value.familyNames[0].trim();
        const fullName = `${givenName} ${familyName}`;

        // Check if there is any name present in the contact
        if (!familyName && !givenName && !displayName) {
            return false;
        }

        // Check if the last name is valid
        if (familyName && !isFirstLastNameValid(familyName)) {
            return false;
        }

        // Check if the first name is valid
        if (givenName && !isFirstLastNameValid(givenName)) {
            return false;
        }

        // Check if the display name is valid when editing a contact
        if ((contactID && displayName && !isContactNameValid(displayName)) || (contactID && !displayName)) {
            return false;
        }

        // Check if the full name is valid when creating a contact
        if ((!contactID && fullName && !isContactNameValid(fullName)) || (!contactID && !fullName)) {
            return false;
        }

        return true;
    };

    const handleRemove = (propertyUID: string) => {
        setVCardContact((vCardContact) => {
            return removeVCardProperty(vCardContact, propertyUID);
        });
    };

    const focusOnField = (uid: string) => {
        const elm = document.querySelector(`[data-contact-property-id="${uid}"]`) as HTMLElement;

        // Try to focus on the input field, if not present try the textarea
        const hasInput = elm?.querySelector('input');
        if (hasInput) {
            hasInput.focus();
            return;
        }

        elm?.querySelector('textarea')?.focus();
    };

    const handleAdd = (inputField?: string) => () => {
        let field = inputField;

        if (!field) {
            // Get random field from other info, but not a limited one
            const properties = getVCardProperties(vCardContact);
            const filteredOtherInformationFields = otherInformationFields.filter(
                (field) => isMultiValue(field) || !properties.find((property) => property.field === field)
            );

            const index = randomIntFromInterval(0, filteredOtherInformationFields.length - 1);

            field = filteredOtherInformationFields[index];
        }

        setVCardContact((vCardContact) => {
            const { newVCardContact, newVCardProperty } = addVCardProperty(vCardContact, { field } as VCardProperty);
            setTimeout(() => focusOnField(newVCardProperty.uid));
            return newVCardContact;
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const saveContactGroups = useHandler(async () => {
        await Promise.all(
            Object.values(modelContactEmails).map(async (modelContactEmail) => {
                if (modelContactEmail) {
                    const contactEmail = getContactEmail(modelContactEmail.Email);
                    if (contactEmail) {
                        await applyGroups([contactEmail], modelContactEmail.changes, true);
                    }
                }
            })
        );
    });

    const handleSubmit = async () => {
        setIsSubmitted(true);
        if (!isFormValid()) {
            firstNameFieldRef.current?.focus();
            return;
        }

        try {
            await saveVCardContact(contactID, vCardContact);
            await call();
            await saveContactGroups();
            onChange?.();
            createNotification({ text: c('Success').t`Contact saved` });
        } finally {
            rest.onClose?.();
        }
    };

    const handleChangeVCard = (property: VCardProperty) => {
        setVCardContact((vCardContact) => {
            return updateVCardContact(vCardContact, property);
        });
    };

    const handleContactEmailChange = (contactEmail: ContactEmailModel) =>
        setModelContactEmails((modelContactEmails) => ({ ...modelContactEmails, [contactEmail.Email]: contactEmail }));

    useEffect(() => {
        if (newField) {
            handleAdd(newField)();
        }
    }, [newField]);

    // Default focus on name field
    useEffect(() => {
        firstNameFieldRef.current?.focus();
    }, []);

    return (
        <>
            <ModalTwo size="large" className="contacts-modal" {...rest}>
                <ModalTwoHeader title={title} />
                <ModalTwoContent>
                    <div className="mb-4">
                        <ContactEditProperty
                            ref={firstNameFieldRef}
                            vCardContact={vCardContact}
                            isSubmitted={isSubmitted}
                            onRemove={handleRemove}
                            actionRow={false}
                            vCardProperty={nameProperty}
                            onChangeVCard={handleChangeVCard}
                            onUpgrade={onUpgrade}
                            onSelectImage={onSelectImage}
                            onGroupEdit={onGroupEdit}
                        />
                        <ContactEditProperty
                            ref={displayNameFieldRef}
                            vCardContact={vCardContact}
                            isSubmitted={isSubmitted}
                            onRemove={handleRemove}
                            actionRow={false}
                            vCardProperty={displayNameProperty}
                            onChangeVCard={handleChangeVCard}
                            onUpgrade={onUpgrade}
                            onSelectImage={onSelectImage}
                            onGroupEdit={onGroupEdit}
                        />

                        <ContactEditProperty
                            vCardContact={vCardContact}
                            isSubmitted={isSubmitted}
                            onRemove={handleRemove}
                            actionRow
                            fixedType
                            vCardProperty={photoProperty}
                            onChangeVCard={handleChangeVCard}
                            onUpgrade={onUpgrade}
                            onSelectImage={onSelectImage}
                            onGroupEdit={onGroupEdit}
                        />
                    </div>
                    <ContactEditProperties
                        field="fn"
                        isSignatureVerified
                        isSubmitted={isSubmitted}
                        onRemove={handleRemove}
                        vCardContact={vCardContact}
                        onChangeVCard={handleChangeVCard}
                        onUpgrade={onUpgrade}
                        onSelectImage={onSelectImage}
                        onGroupEdit={onGroupEdit}
                    />
                    <ContactEditProperties
                        field="email"
                        isSignatureVerified
                        isSubmitted={isSubmitted}
                        onRemove={handleRemove}
                        sortable
                        onAdd={handleAdd('email')}
                        contactEmails={modelContactEmails}
                        onContactEmailChange={handleContactEmailChange}
                        vCardContact={vCardContact}
                        onChangeVCard={handleChangeVCard}
                        onUpgrade={onUpgrade}
                        onSelectImage={onSelectImage}
                        onGroupEdit={onGroupEdit}
                        onLimitReached={onLimitReached}
                    />
                    {['tel', 'adr', 'bday', 'note'].map((item) => (
                        <ContactEditProperties
                            key={item}
                            field={item}
                            isSignatureVerified
                            isSubmitted={isSubmitted}
                            onRemove={handleRemove}
                            sortable
                            onAdd={handleAdd(item)}
                            vCardContact={vCardContact}
                            onChangeVCard={handleChangeVCard}
                            onUpgrade={onUpgrade}
                            onSelectImage={onSelectImage}
                            onGroupEdit={onGroupEdit}
                        />
                    ))}
                    <ContactEditProperties
                        isSubmitted={isSubmitted}
                        isSignatureVerified
                        onRemove={handleRemove}
                        onAdd={handleAdd()}
                        vCardContact={vCardContact}
                        onChangeVCard={handleChangeVCard}
                        onUpgrade={onUpgrade}
                        onSelectImage={onSelectImage}
                        onGroupEdit={onGroupEdit}
                    />
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                    <Button
                        color="norm"
                        loading={loading}
                        data-testid="create-contact:save"
                        onClick={() => withLoading(handleSubmit())}
                    >
                        {c('Action').t`Save`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
            {contactGroupLimitReachedModal}
        </>
    );
};

export default ContactEditModal;

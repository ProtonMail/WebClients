import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import {
    addVCardProperty,
    getSortedProperties,
    getVCardProperties,
    removeVCardProperty,
    updateVCardContact,
} from '@proton/shared/lib/contacts/properties';
import { isContactNameValid } from '@proton/shared/lib/contacts/property';
import { prepareForEdition } from '@proton/shared/lib/contacts/surgery';
import { isMultiValue } from '@proton/shared/lib/contacts/vcard';
import { getOtherInformationFields } from '@proton/shared/lib/helpers/contacts';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import { ContactEmail, ContactEmailModel } from '@proton/shared/lib/interfaces/contacts/Contact';
import { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components';
import { useContactEmails, useEventManager, useHandler, useNotifications } from '../../../hooks';
import { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import useApplyGroups from '../hooks/useApplyGroups';
import { useSaveVCardContact } from '../hooks/useSaveVCardContact';
import { ContactGroupLimitReachedProps } from '../modals/ContactGroupLimitReachedModal';
import { ContactImageProps } from '../modals/ContactImageModal';
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

    const nameFieldRef = useRef<HTMLInputElement>(null);
    const [contactEmails, loadingContactEmails] = useContactEmails() as [ContactEmail[], boolean, any];
    const [modelContactEmails, setModelContactEmails] = useState<SimpleMap<ContactEmailModel>>({});

    const saveVCardContact = useSaveVCardContact();
    const { applyGroups, contactGroupLimitReachedModal } = useApplyGroups();
    const title = contactID ? c('Title').t`Edit contact` : c('Title').t`Create contact`;

    const nameProperty = getSortedProperties(vCardContact, 'fn')[0] as VCardProperty<string>;
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
                nameProperty.value.trim() === contactEmail.Name &&
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
                        Name: nameProperty.value as string,
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
                    Name: nameProperty.value as string,
                };
                return;
            }

            newModelContactEmails[email] = {
                uid,
                changes: {},
                Email: email,
                ContactID: contactID || '',
                LabelIDs: [],
                Name: nameProperty.value as string,
            };
        });

        setModelContactEmails(newModelContactEmails);
    }, [loadingContactEmails, vCardContact.email]);

    const isFormValid = () => {
        const nameFilled = !!nameProperty?.value && isContactNameValid(nameProperty.value);
        return nameFilled;
    };

    const handleRemove = (propertyUID: string) => {
        setVCardContact((vCardContact) => {
            return removeVCardProperty(vCardContact, propertyUID);
        });
    };

    const focusOnField = (uid: string) => {
        const elm = document.querySelector(`[data-contact-property-id="${uid}"]`) as HTMLElement;

        elm?.querySelector('input')?.focus();
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
            nameFieldRef.current?.focus();
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
        nameFieldRef.current?.focus();
    }, []);

    return (
        <>
            <ModalTwo size="large" className="contacts-modal" {...rest}>
                <ModalTwoHeader title={title} />
                <ModalTwoContent>
                    <div className="mb-4">
                        <ContactEditProperty
                            ref={nameFieldRef}
                            isSubmitted={isSubmitted}
                            onRemove={handleRemove}
                            actionRow={false}
                            mainItem
                            vCardProperty={nameProperty}
                            onChangeVCard={handleChangeVCard}
                            onUpgrade={onUpgrade}
                            onSelectImage={onSelectImage}
                            onGroupEdit={onGroupEdit}
                        />

                        <ContactEditProperty
                            isSubmitted={isSubmitted}
                            onRemove={handleRemove}
                            actionRow
                            fixedType
                            mainItem
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
                    <ContactEditProperties
                        field="tel"
                        isSignatureVerified
                        isSubmitted={isSubmitted}
                        onRemove={handleRemove}
                        sortable
                        onAdd={handleAdd('tel')}
                        vCardContact={vCardContact}
                        onChangeVCard={handleChangeVCard}
                        onUpgrade={onUpgrade}
                        onSelectImage={onSelectImage}
                        onGroupEdit={onGroupEdit}
                    />
                    <ContactEditProperties
                        field="adr"
                        isSignatureVerified
                        isSubmitted={isSubmitted}
                        onRemove={handleRemove}
                        sortable
                        onAdd={handleAdd('adr')}
                        vCardContact={vCardContact}
                        onChangeVCard={handleChangeVCard}
                        onUpgrade={onUpgrade}
                        onSelectImage={onSelectImage}
                        onGroupEdit={onGroupEdit}
                    />
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

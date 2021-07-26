import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { c } from 'ttag';
import { addContacts } from '@proton/shared/lib/api/contacts';
import { randomIntFromInterval, noop } from '@proton/shared/lib/helpers/function';
import { hasCategories } from '@proton/shared/lib/contacts/properties';
import { prepareContacts } from '@proton/shared/lib/contacts/encrypt';
import { getEditableFields, getOtherInformationFields } from '@proton/shared/lib/helpers/contacts';
import { API_CODES } from '@proton/shared/lib/constants';
import { OVERWRITE, CATEGORIES } from '@proton/shared/lib/contacts/constants';
import {
    ContactEmail,
    ContactEmailModel,
    ContactProperties,
    ContactProperty,
    ContactPropertyChange,
} from '@proton/shared/lib/interfaces/contacts/Contact';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { canonizeEmail } from '@proton/shared/lib/helpers/email';
import ContactModalProperties from '../ContactModalProperties';
import {
    useUserKeys,
    useApi,
    useNotifications,
    useLoading,
    useEventManager,
    useContactEmails,
    useHandler,
} from '../../../hooks';
import { FormModal, PrimaryButton } from '../../../components';
import { generateUID } from '../../../helpers';
import ContactModalRow from '../../../components/contacts/ContactModalRow';
import useApplyGroups from '../useApplyGroups';

const DEFAULT_MODEL = [
    { field: 'fn', value: '' },
    { field: 'email', value: '' },
    { field: 'photo', value: '' },
];
const { OVERWRITE_CONTACT, THROW_ERROR_IF_CONFLICT } = OVERWRITE;
const { INCLUDE, IGNORE } = CATEGORIES;
const { SINGLE_SUCCESS } = API_CODES;

const editableFields = getEditableFields().map(({ value }) => value);
const otherInformationFields = getOtherInformationFields().map(({ value }) => value);
const UID_PREFIX = 'contact-property';

const formatModel = (properties: ContactProperties = []): ContactProperties => {
    if (!properties.length) {
        return DEFAULT_MODEL.map((property) => ({ ...property, uid: generateUID(UID_PREFIX) })); // Add UID to localize the property easily;
    }
    // Ensure name exists even if it should always be there
    if (!properties.find((property) => property.field === 'fn')) {
        properties.push({ field: 'fn', value: '' });
    }
    // Ensure photo field is prepared
    if (!properties.find((property) => property.field === 'photo')) {
        properties.push({ field: 'photo', value: '' });
    }
    return properties
        .filter(({ field }) => editableFields.includes(field)) // Only includes editable properties that we decided
        .map((property) => ({ ...property, uid: generateUID(UID_PREFIX) })); // Add UID to localize the property easily
};

const getNotEditableProperties = (properties: ContactProperties = []): ContactProperties => {
    return properties.filter(({ field }) => !editableFields.includes(field));
};

interface Props {
    contactID?: string;
    properties?: ContactProperties;
    onAdd?: () => void;
    onClose?: () => void;
    newField?: string;
}

const ContactModal = ({
    contactID,
    properties: initialProperties = [],
    onAdd = noop,
    onClose = noop,
    newField,
    ...rest
}: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [allProperties, setAllProperties] = useState<ContactProperties>(formatModel(initialProperties));
    const [notEditableProperties, setNotEditableProperties] = useState<ContactProperties>(
        getNotEditableProperties(initialProperties)
    );
    const nameFieldRef = useRef<HTMLInputElement>(null);
    const [contactEmails, loadingContactEmails] = useContactEmails() as [ContactEmail[], boolean, any];
    const [modelContactEmails, setModelContactEmails] = useState<SimpleMap<ContactEmailModel>>({});
    const applyGroups = useApplyGroups();

    const title = contactID ? c('Title').t`Edit contact` : c('Title').t`Create contact`;

    const nameProperty = useMemo(
        // Ignoring undefined should be ok because formatModel should prevent the field to not exist
        () => allProperties.find((property) => property.field === 'fn') as ContactProperty,
        [allProperties]
    );
    const photoProperty = useMemo(
        // Ignoring undefined should be ok because formatModel should prevent the field to not exist
        () => allProperties.find((property) => property.field === 'photo') as ContactProperty,
        [allProperties]
    );
    const properties = useMemo(
        () => allProperties.filter((property) => property !== nameProperty && property !== photoProperty),
        [allProperties]
    );

    useEffect(() => {
        if (loadingContactEmails) {
            return;
        }

        const newModelContactEmails = { ...modelContactEmails };

        const emails = allProperties.filter((property) => property.field === 'email');

        emails.forEach((emailProperty) => {
            const uid = emailProperty.uid as string;
            const email = emailProperty.value as string;

            const existingModel = Object.values(newModelContactEmails).find(
                (contactEmail) => contactEmail?.uid === uid
            );

            if (existingModel) {
                if (existingModel.Email !== email) {
                    const oldEmail = existingModel.Email;
                    newModelContactEmails[email] = { ...existingModel, Email: email };
                    delete newModelContactEmails[oldEmail];
                }
                return;
            }

            const existingContactEmail = contactEmails.find(
                (contactEmail) => canonizeEmail(contactEmail.Email) === canonizeEmail(email)
            );

            if (existingContactEmail) {
                newModelContactEmails[email] = { ...existingContactEmail, uid, changes: {} };
                return;
            }

            newModelContactEmails[email] = {
                uid,
                changes: {},
                Email: email,
                ContactID: contactID || '',
                LabelIDs: [],
            };
        });

        setModelContactEmails(newModelContactEmails);
    }, [loadingContactEmails, allProperties]);

    const isFormValid = () => {
        const nameFilled = !!nameProperty?.value;
        return nameFilled;
    };

    const handleRemove = (propertyUID: string) => {
        const property = allProperties.find(({ uid }) => uid === propertyUID);

        // If we remove an email with groups attached to it, remove all groups properties too
        if (property?.group) {
            const notEditablePropertiesUpdated = notEditableProperties.filter((prop) => prop.group !== property.group);
            setNotEditableProperties(notEditablePropertiesUpdated);
        }

        // Never remove the last photo property
        if (property?.field === 'photo') {
            const photoCount = allProperties.filter(({ field }) => field === 'photo').length;
            if (photoCount === 1) {
                const newValue = allProperties.map((property) => {
                    if (property.field === 'photo') {
                        return { ...property, value: '' };
                    }
                    return property;
                });
                setAllProperties(newValue);
                return;
            }
        }

        setAllProperties(allProperties.filter(({ uid }) => uid !== propertyUID));
    };

    const focusOnField = (uid: string) => {
        const elm = document.querySelector(`[data-contact-property-id="${uid}"]`) as HTMLElement;

        elm?.querySelector('input')?.focus();
    };

    const handleAdd = (field?: string) => () => {
        const uid = generateUID(UID_PREFIX);

        if (!field) {
            // Get random field from other info, but not a limited one
            const filteredOtherInformationFields = otherInformationFields.filter(
                (field) => !allProperties.find((property) => property.field === field)
            );

            const index = randomIntFromInterval(0, filteredOtherInformationFields.length - 1);

            setAllProperties([...allProperties, { field: filteredOtherInformationFields[index], value: '', uid }]);
            window.setTimeout(() => focusOnField(uid));
            return;
        }

        setAllProperties([...allProperties, { field, value: '', uid }]);
        window.setTimeout(() => focusOnField(uid));
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const saveContactGroups = useHandler(async () => {
        await Promise.all(
            Object.values(modelContactEmails).map(async (modelContactEmail) => {
                if (modelContactEmail) {
                    const contactEmail = contactEmails.find(
                        (contactEmail) => contactEmail.Email === modelContactEmail?.Email
                    );
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

        const Contacts = await prepareContacts([allProperties.concat(notEditableProperties)], userKeysList[0]);
        const labels = hasCategories(notEditableProperties) ? INCLUDE : IGNORE;
        const {
            Responses: [{ Response: { Code = null } = {} }],
        } = await api(
            addContacts({
                Contacts,
                Overwrite: contactID ? OVERWRITE_CONTACT : THROW_ERROR_IF_CONFLICT,
                Labels: labels,
            })
        );

        if (Code !== SINGLE_SUCCESS) {
            onClose();
            return createNotification({ text: c('Error').t`Contact could not be saved`, type: 'error' });
        }
        await call();
        if (!contactID) {
            onAdd();
        }

        await saveContactGroups();

        onClose();
        createNotification({ text: c('Success').t`Contact saved` });
    };

    const handleChange = ({ uid: propertyUID, value, key = 'value' }: ContactPropertyChange) => {
        const newProperties = allProperties.map((property: ContactProperty) => {
            if (property.uid === propertyUID) {
                return {
                    ...property,
                    [key]: value,
                };
            }
            return property;
        });
        setAllProperties(newProperties);
    };

    const handleContactEmailChange = (contactEmail: ContactEmailModel) =>
        setModelContactEmails((modelContactEmails) => ({ ...modelContactEmails, [contactEmail.Email]: contactEmail }));

    const handleOrderChange = useCallback(
        (field, orderedProperties) => {
            const newProperties = allProperties.filter((property: ContactProperty) => property.field !== field);
            newProperties.unshift(...orderedProperties);

            setAllProperties(newProperties);
        },
        [properties]
    );

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
        <FormModal
            loading={loading || loadingUserKeys}
            title={title}
            submit={
                <PrimaryButton loading={loading || loadingUserKeys} onClick={() => withLoading(handleSubmit())}>
                    {c('Action').t`Save`}
                </PrimaryButton>
            }
            onClose={onClose}
            {...rest}
        >
            <div className="mb1">
                <ContactModalRow
                    ref={nameFieldRef}
                    isSubmitted={isSubmitted}
                    property={nameProperty}
                    onChange={handleChange}
                    onRemove={handleRemove}
                    isOrderable={false}
                    actionRow={false}
                    mainItem
                />

                <ContactModalRow
                    isSubmitted={isSubmitted}
                    property={photoProperty}
                    onChange={handleChange}
                    onRemove={handleRemove}
                    isOrderable={false}
                    actionRow
                    fixedType
                    mainItem
                />
            </div>
            <ContactModalProperties
                ref={nameFieldRef}
                properties={properties}
                field="fn"
                isSubmitted={isSubmitted}
                onChange={handleChange}
                onRemove={handleRemove}
            />
            <ContactModalProperties
                properties={properties}
                field="email"
                isSubmitted={isSubmitted}
                onChange={handleChange}
                onRemove={handleRemove}
                onOrderChange={handleOrderChange}
                onAdd={handleAdd('email')}
                contactEmails={modelContactEmails}
                onContactEmailChange={handleContactEmailChange}
            />
            <ContactModalProperties
                properties={properties}
                field="tel"
                isSubmitted={isSubmitted}
                onChange={handleChange}
                onRemove={handleRemove}
                onOrderChange={handleOrderChange}
                onAdd={handleAdd('tel')}
            />
            <ContactModalProperties
                properties={properties}
                field="adr"
                isSubmitted={isSubmitted}
                onChange={handleChange}
                onRemove={handleRemove}
                onOrderChange={handleOrderChange}
                onAdd={handleAdd('adr')}
            />
            <ContactModalProperties
                isSubmitted={isSubmitted}
                properties={properties}
                onChange={handleChange}
                onRemove={handleRemove}
                onAdd={handleAdd()}
            />
        </FormModal>
    );
};

export default ContactModal;

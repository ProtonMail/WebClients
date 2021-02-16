import React, { useState, useCallback, useEffect, useRef } from 'react';
import { c } from 'ttag';
import { addContacts } from 'proton-shared/lib/api/contacts';
import { randomIntFromInterval, noop } from 'proton-shared/lib/helpers/function';
import { hasCategories } from 'proton-shared/lib/contacts/properties';
import { prepareContacts } from 'proton-shared/lib/contacts/encrypt';
import { getEditableFields, getOtherInformationFields } from 'proton-shared/lib/helpers/contacts';
import { API_CODES } from 'proton-shared/lib/constants';
import { OVERWRITE, CATEGORIES } from 'proton-shared/lib/contacts/constants';
import {
    ContactProperties,
    ContactProperty,
    ContactPropertyChange,
} from 'proton-shared/lib/interfaces/contacts/Contact';
import { useHistory } from 'react-router';
import ContactModalProperties from '../ContactModalProperties';
import { useUserKeys, useApi, useNotifications, useLoading, useEventManager } from '../../../hooks';
import { Alert, FormModal, PrimaryButton } from '../../../components';
import { generateUID } from '../../../helpers';

const DEFAULT_MODEL = [
    { field: 'fn', value: '' },
    { field: 'email', value: '' },
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
    return properties
        .filter(({ field }) => editableFields.includes(field)) // Only includes editable properties that we decided
        .map((property) => ({ ...property, uid: generateUID(UID_PREFIX) })); // Add UID to localize the property easily
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
    const history = useHistory();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const [properties, setProperties] = useState<ContactProperties>(formatModel(initialProperties));
    const nameFieldRef = useRef<HTMLInputElement>(null);

    const isFormValid = () => {
        const nameProperty = properties.find((property) => property.field === 'fn');
        const nameFilled = !!nameProperty?.value;
        return nameFilled;
    };

    const title = contactID ? c('Title').t`Edit contact details` : c('Title').t`Create contact`;

    const handleRemove = (propertyUID: string) => {
        setProperties(properties.filter(({ uid }: ContactProperty) => uid !== propertyUID));
    };

    const handleAdd = (field?: string) => () => {
        if (!field) {
            // Get random field from other info
            const index = randomIntFromInterval(0, otherInformationFields.length - 1);
            return setProperties([
                ...properties,
                { field: otherInformationFields[index], value: '', uid: generateUID(UID_PREFIX) },
            ]);
        }
        setProperties([...properties, { field, value: '', uid: generateUID(UID_PREFIX) }]);
    };

    const handleSubmit = async () => {
        setIsSubmitted(true);

        if (!isFormValid()) {
            nameFieldRef.current?.focus();
            return;
        }

        const notEditableProperties = initialProperties.filter(({ field }) => !editableFields.includes(field));
        const Contacts = await prepareContacts([properties.concat(notEditableProperties)], userKeysList[0]);
        const labels = hasCategories(notEditableProperties) ? INCLUDE : IGNORE;
        const {
            Responses: [{ Response: { Code = null, Contact: { ID = null } = {} } = {} }],
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

            /* in the context of proton-contacts */
            if (history) {
                history.push(`/${ID}`);
            }
        }
        onClose();
        createNotification({ text: c('Success').t`Contact saved` });
    };

    const handleChange = ({ uid: propertyUID, value, key = 'value' }: ContactPropertyChange) => {
        const newProperties = properties.map((property: ContactProperty) => {
            if (property.uid === propertyUID) {
                return {
                    ...property,
                    [key]: value,
                };
            }
            return property;
        });
        setProperties(newProperties);
    };

    const handleOrderChange = useCallback(
        (field, orderedProperties) => {
            const newProperties = properties.filter((property: ContactProperty) => property.field !== field);
            newProperties.unshift(...orderedProperties);

            setProperties(newProperties);
        },
        [properties]
    );

    useEffect(() => {
        if (newField) {
            handleAdd(newField)();
        }
    }, [newField]);

    return (
        <FormModal
            loading={loading || loadingUserKeys}
            onSubmit={() => withLoading(handleSubmit())}
            title={title}
            submit={
                <PrimaryButton loading={loading || loadingUserKeys} onClick={() => withLoading(handleSubmit())}>
                    {c('Action').t`Save`}
                </PrimaryButton>
            }
            onClose={onClose}
            {...rest}
        >
            <Alert>{c('Info')
                .t`Email address, phone number and address at the top of their respective list are automatically set as the default information and will be displayed in the contact information's summary section.`}</Alert>
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

import { Ref, forwardRef } from 'react';

import { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import ContactFieldString from './ContactFieldString';

interface Props {
    contactID?: string;
    vCardContact: VCardContact;
    vCardProperty: VCardProperty<string[]>;
    isSubmitted: boolean;
    onChangeVCard: (vCardProperty: VCardProperty) => void;
}

enum FieldsPos {
    lastName = 0,
    firstName = 1,
}

const ContactFieldN = (
    { contactID, vCardContact, vCardProperty, isSubmitted, onChangeVCard, ...rest }: Props,
    firstNameFieldRef: Ref<HTMLInputElement>
) => {
    const [lastName, firstName] = vCardProperty.value;
    const requiredError =
        !contactID && !vCardContact.fn?.[0].value && isSubmitted && !vCardProperty.value.join('').trim().length;

    // The N field is an array where the first element is the last name and the second element is the first name.
    const handleChange = (change: VCardProperty, pos: FieldsPos) => {
        const { value } = change;
        const newValue = [...vCardProperty.value];
        newValue[pos] = value;

        onChangeVCard({ ...vCardProperty, field: 'n', value: newValue });
    };

    return (
        <div>
            <div className="flex flex-col on-mobile-flex-column gap-2">
                <ContactFieldString
                    ref={firstNameFieldRef}
                    vCardProperty={{ ...vCardProperty, field: 'firstName', value: firstName }}
                    onChange={(change) => handleChange(change, FieldsPos.firstName)}
                    error={requiredError}
                    {...rest}
                />
                <ContactFieldString
                    vCardProperty={{ ...vCardProperty, field: 'lastName', value: lastName }}
                    onChange={(change) => handleChange(change, FieldsPos.lastName)}
                    error={requiredError}
                    {...rest}
                />
            </div>
        </div>
    );
};

export default forwardRef(ContactFieldN);

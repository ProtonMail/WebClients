import type { Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import ErrorZone from '@proton/components/components/text/ErrorZone';
import { isFirstLastNameValid } from '@proton/shared/lib/contacts/property';
import type { VCardContact, VCardProperty, VcardNValue } from '@proton/shared/lib/interfaces/contacts/VCard';

import ContactFieldString from './ContactFieldString';

interface Props {
    vCardContact: VCardContact;
    vCardProperty: VCardProperty<VcardNValue>;
    isSubmitted: boolean;
    onChangeVCard: (vCardProperty: VCardProperty<VcardNValue>) => void;
}

enum FieldsPos {
    familyName = 0,
    givenName = 1,
}

const ContactFieldN = (
    { vCardContact, vCardProperty, isSubmitted, onChangeVCard, ...rest }: Props,
    firstNameFieldRef: Ref<HTMLInputElement>
) => {
    const givenName = vCardProperty.value.givenNames[0] || '';
    const familyName = vCardProperty.value.familyNames[0] || '';

    // The N field is an array where the first element is the family name and the second element is the given name.
    const handleChange = (change: VCardProperty, pos: FieldsPos) => {
        const { value } = change;
        const newValue = { ...vCardProperty.value };
        if (pos === FieldsPos.familyName) {
            newValue.familyNames[0] = value;
        } else {
            newValue.givenNames[0] = value;
        }

        onChangeVCard({ ...vCardProperty, field: 'n', value: newValue });
    };

    const givenNameTooLong = !isFirstLastNameValid(givenName);
    const familyNameTooLong = !isFirstLastNameValid(familyName);
    const requiredError = !vCardContact.fn?.[0].value && isSubmitted && !givenName && !familyName;

    return (
        <div className="flex flex-column md:flex-row gap-2">
            <div className="md:flex-1">
                <ContactFieldString
                    ref={firstNameFieldRef}
                    placeholder={c('Placeholder').t`First name`}
                    data-testid="First name"
                    vCardProperty={{ ...vCardProperty, field: 'givenName', value: givenName }}
                    onChange={(change) => handleChange(change, FieldsPos.givenName)}
                    error={requiredError || givenNameTooLong}
                    {...rest}
                />
                {givenNameTooLong ? <ErrorZone>{c('Error').t`First name is too long`}</ErrorZone> : null}
            </div>
            <div className="md:flex-1">
                <ContactFieldString
                    placeholder={c('Placeholder').t`Last name`}
                    data-testid="Last name"
                    vCardProperty={{ ...vCardProperty, field: 'familyName', value: familyName }}
                    onChange={(change) => handleChange(change, FieldsPos.familyName)}
                    error={requiredError || familyNameTooLong}
                    {...rest}
                />
                {familyNameTooLong ? <ErrorZone>{c('Error').t`Last name is too long`}</ErrorZone> : null}
            </div>
        </div>
    );
};

export default forwardRef(ContactFieldN);

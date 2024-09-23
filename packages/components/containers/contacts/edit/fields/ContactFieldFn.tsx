import type { ChangeEvent, Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import type { InputProps } from '@proton/atoms';
import { Input } from '@proton/atoms';
import ErrorZone from '@proton/components/components/text/ErrorZone';
import { isContactNameValid } from '@proton/shared/lib/contacts/property';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

interface Props extends Omit<InputProps, 'onChange'> {
    vCardContact: VCardContact;
    vCardProperty: VCardProperty<string>;
    isSubmitted: boolean;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldFn = (
    { vCardContact, vCardProperty, isSubmitted, onChange, ...rest }: Props,
    ref: Ref<HTMLInputElement>
) => {
    // The version field is not present when creating new contacts
    const isNewContact = !vCardContact?.version;

    const label = c('Contact field label').t`Enter a display name or nickname`;

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const newValue = target.value;
        onChange({ ...vCardProperty, value: newValue });
    };

    const givenName = vCardContact.n?.value.givenNames.join(' ')?.trim() ?? null;
    const familyName = vCardContact.n?.value.familyNames.join(' ')?.trim() ?? null;
    const nameTooLongError = !isContactNameValid(vCardProperty.value);

    // The fn field can be left empty when creating a new contact as long as something is present in the first or last name field
    const requiredError = isNewContact
        ? isSubmitted && !givenName && !familyName && requiredValidator(vCardProperty.value)
        : isSubmitted && requiredValidator(vCardProperty.value);

    return (
        <>
            <Input
                ref={ref}
                value={vCardProperty.value}
                placeholder={label}
                onChange={handleChange}
                data-testid={label}
                error={!!requiredError || nameTooLongError}
                {...rest}
            />
            {nameTooLongError ? <ErrorZone>{c('Error').t`Contact name is too long`}</ErrorZone> : null}
            {!!requiredError && !isNewContact ? <ErrorZone>{requiredError}</ErrorZone> : null}
            {!!requiredError && isNewContact ? (
                <ErrorZone>{c('Error').t`Please provide either a first name, a last name or a display name`}</ErrorZone>
            ) : null}
        </>
    );
};

export default forwardRef(ContactFieldFn);

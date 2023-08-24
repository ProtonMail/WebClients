import { ChangeEvent, Ref, forwardRef } from 'react';

import { c } from 'ttag';

import { Input, InputProps } from '@proton/atoms';
import { isContactNameValid } from '@proton/shared/lib/contacts/property';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { ErrorZone } from '../../../../components';

interface Props extends Omit<InputProps, 'onChange'> {
    contactID?: string;
    vCardContact: VCardContact;
    vCardProperty: VCardProperty<string>;
    isSubmitted: boolean;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldFn = (
    { contactID, vCardContact, vCardProperty, isSubmitted, onChange, ...rest }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const label = c('Contact field label').t`Enter a display name or nickname`;

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const newValue = target.value;
        onChange({ ...vCardProperty, value: newValue });
    };

    const givenName = vCardContact.n?.value.givenNames.join(' ')?.trim() ?? null;
    const familyName = vCardContact.n?.value.familyNames.join(' ')?.trim() ?? null;
    const nameTooLongError = !isContactNameValid(vCardProperty.value);

    // The fn field is required for existing contacts but can be left empty for new contacts
    // Display an error border when the fn field and the n field is empty during contact creation
    const requiredError = contactID
        ? isSubmitted && requiredValidator(vCardProperty.value)
        : isSubmitted && !givenName && !familyName && requiredValidator(vCardProperty.value);

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
            {!!requiredError && contactID ? <ErrorZone>{requiredError}</ErrorZone> : null}
            {!!requiredError && !contactID ? (
                <ErrorZone>{c('Error').t`Please provide either a first name, a last name or a display name`}</ErrorZone>
            ) : null}
        </>
    );
};

export default forwardRef(ContactFieldFn);

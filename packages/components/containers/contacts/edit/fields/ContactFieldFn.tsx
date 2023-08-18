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

    const isFirstAndLastNameArray = Array.isArray(vCardContact.n?.value);
    const firstAndLastName = isFirstAndLastNameArray ? vCardContact.n?.value.join('').trim() : '';

    const nameTooLongError = !isContactNameValid(vCardProperty.value);
    // The fn field is required for existing contacts but can be left empty for new contacts
    const requiredError = contactID && isSubmitted && requiredValidator(vCardProperty.value);
    // Display an error border when the fn field and the n field is empty during contact creation
    const noNameInfoDuringCreationError =
        !contactID && isSubmitted && !firstAndLastName && requiredValidator(vCardProperty.value);

    return (
        <>
            <Input
                ref={ref}
                value={vCardProperty.value}
                placeholder={label}
                onChange={handleChange}
                data-testid={label}
                error={!!requiredError || nameTooLongError || noNameInfoDuringCreationError}
                {...rest}
            />
            {!!requiredError ? <ErrorZone>{requiredError}</ErrorZone> : null}
            {nameTooLongError ? <ErrorZone>{c('Error').t`Contact name is too long`}</ErrorZone> : null}
            {noNameInfoDuringCreationError ? (
                <ErrorZone>{c('Error').t`Please provide either a first name, a last name or a display name`}</ErrorZone>
            ) : null}
        </>
    );
};

export default forwardRef(ContactFieldFn);

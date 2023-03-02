import { ChangeEvent, Ref, forwardRef } from 'react';

import { c } from 'ttag';

import { Input, InputProps } from '@proton/atoms';
import { isContactNameValid } from '@proton/shared/lib/contacts/property';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { ErrorZone } from '../../../../components';

interface Props extends Omit<InputProps, 'onChange'> {
    vCardProperty: VCardProperty<string>;
    isSubmitted: boolean;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldFn = ({ vCardProperty, isSubmitted, onChange, ...rest }: Props, ref: Ref<HTMLInputElement>) => {
    const label = getAllFieldLabels().fn;

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const newValue = target.value;
        onChange({ ...vCardProperty, value: newValue });
    };

    const requiredError = isSubmitted && requiredValidator(vCardProperty.value);
    const nameTooLongError = !isContactNameValid(vCardProperty.value);

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
            {!!requiredError ? <ErrorZone>{requiredError}</ErrorZone> : null}
            {nameTooLongError ? <ErrorZone>{c('Error').t`Contact name is too long`}</ErrorZone> : null}
        </>
    );
};

export default forwardRef(ContactFieldFn);

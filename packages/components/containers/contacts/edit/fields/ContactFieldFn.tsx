import { ChangeEvent, forwardRef, Ref } from 'react';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { ErrorZone, InputTwo } from '../../../../components';
import { InputTwoProps } from '../../../../components/v2/input/Input';

interface Props extends Omit<InputTwoProps, 'onChange'> {
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

    return (
        <>
            <InputTwo
                ref={ref}
                value={vCardProperty.value}
                placeholder={label}
                onChange={handleChange}
                data-testid={label}
                error={!!requiredError}
                {...rest}
            />
            {!!requiredError ? <ErrorZone>{requiredError}</ErrorZone> : null}
        </>
    );
};

export default forwardRef(ContactFieldFn);

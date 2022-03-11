import { ChangeEvent, forwardRef, Ref } from 'react';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { InputTwo } from '../../../../components';
import { InputTwoProps } from '../../../../components/v2/input/Input';

interface Props extends Omit<InputTwoProps, 'onChange'> {
    vCardProperty: VCardProperty<string>;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldFn = ({ vCardProperty, onChange, ...rest }: Props, ref: Ref<HTMLInputElement>) => {
    const label = getAllFieldLabels().fn;

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const newValue = target.value;
        onChange({ ...vCardProperty, value: newValue });
    };

    return (
        <InputTwo
            ref={ref}
            value={vCardProperty.value}
            placeholder={label}
            onChange={handleChange}
            data-testid={label}
            required
            {...rest}
        />
    );
};

export default forwardRef(ContactFieldFn);

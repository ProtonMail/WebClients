import { ChangeEvent } from 'react';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { InputTwo } from '../../../../components';
import { InputTwoProps } from '../../../../components/v2/input/Input';

interface Props extends Omit<InputTwoProps, 'onChange'> {
    vCardProperty: VCardProperty<string>;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldString = ({ vCardProperty, onChange, ...rest }: Props) => {
    const label = (getAllFieldLabels() as any)[vCardProperty.field] || '';

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const newValue = target.value;
        onChange({ ...vCardProperty, value: newValue });
    };

    return (
        <InputTwo
            value={vCardProperty.value}
            placeholder={label}
            onChange={handleChange}
            data-testid={label}
            {...rest}
        />
    );
};

export default ContactFieldString;

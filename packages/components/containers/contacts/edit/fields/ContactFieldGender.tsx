import { ChangeEvent } from 'react';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { VCardGenderValue, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { InputTwo } from '../../../../components';
import { InputTwoProps } from '../../../../components/v2/input/Input';

interface Props extends Omit<InputTwoProps, 'onChange'> {
    vCardProperty: VCardProperty<VCardGenderValue>;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldGender = ({ vCardProperty, onChange, ...rest }: Props) => {
    const label = (getAllFieldLabels() as any).gender;

    const value = vCardProperty.value?.text || '';

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const newValue = target.value;
        onChange({ ...vCardProperty, value: { gender: vCardProperty.value?.gender, text: newValue } });
    };

    return <InputTwo value={value} placeholder={label} onChange={handleChange} data-testid={label} {...rest} />;
};

export default ContactFieldGender;

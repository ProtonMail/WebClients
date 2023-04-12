import { ChangeEvent } from 'react';

import { Input, InputProps } from '@proton/atoms';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

interface Props extends Omit<InputProps, 'onChange'> {
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
        <Input value={vCardProperty.value} placeholder={label} onChange={handleChange} data-testid={label} {...rest} />
    );
};

export default ContactFieldString;

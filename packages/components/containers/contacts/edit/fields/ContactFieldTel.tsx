import { ChangeEvent } from 'react';

import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { TelInput } from '../../../../components';

interface Props {
    vCardProperty: VCardProperty<string>;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldTel = ({ vCardProperty, onChange, ...rest }: Props) => {
    const label = getAllFieldLabels().tel;

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const newValue = target.value;
        onChange({ ...vCardProperty, value: newValue });
    };

    const value = vCardProperty.value || '';

    return <TelInput value={value} placeholder={label} onChange={handleChange} data-testid={label} {...rest} />;
};

export default ContactFieldTel;

import type { ChangeEvent } from 'react';

import EmailInput from '@proton/components/components/input/EmailInput';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import type { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

interface Props {
    vCardProperty: VCardProperty<string>;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldEmail = ({ vCardProperty, onChange, ...rest }: Props) => {
    const label = getAllFieldLabels().email;

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const newValue = target.value;
        onChange({ ...vCardProperty, value: newValue });
    };

    return (
        <EmailInput
            value={vCardProperty.value}
            placeholder={label}
            onChange={handleChange}
            data-testid={label}
            {...rest}
        />
    );
};

export default ContactFieldEmail;

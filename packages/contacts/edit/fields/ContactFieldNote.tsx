import type { ChangeEvent } from 'react';

import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import type { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

interface Props {
    vCardProperty: VCardProperty<string>;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldNote = ({ vCardProperty, onChange, ...rest }: Props) => {
    const label = getAllFieldLabels().note;

    const handleChange = ({ target }: ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = target.value;
        onChange({ ...vCardProperty, value: newValue });
    };

    const value = vCardProperty.value || '';

    return <TextAreaTwo value={value} placeholder={label} onChange={handleChange} data-testid={label} {...rest} />;
};

export default ContactFieldNote;

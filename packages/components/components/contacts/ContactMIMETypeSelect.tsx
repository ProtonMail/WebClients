import { ChangeEvent } from 'react';
import { c } from 'ttag';

import { CONTACT_MIME_TYPES, MIME_TYPES, MIME_TYPES_MORE } from '@proton/shared/lib/constants';

import Select from '../select/Select';

interface Props {
    value: string;
    onChange: (mimeType: CONTACT_MIME_TYPES) => void;
    disabled: boolean;
}

const ContactMIMETypeSelect = ({ value, onChange, disabled }: Props) => {
    const options = [
        { text: c('MIME type').t`Automatic`, value: MIME_TYPES_MORE.AUTOMATIC },
        { text: c('MIME type').t`Plain text`, value: MIME_TYPES.PLAINTEXT },
    ];
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => onChange(target.value as CONTACT_MIME_TYPES);
    return <Select value={value} options={options} disabled={disabled} onChange={handleChange} />;
};

export default ContactMIMETypeSelect;

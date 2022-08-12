import { c } from 'ttag';

import { CONTACT_MIME_TYPES, MIME_TYPES, MIME_TYPES_MORE } from '@proton/shared/lib/constants';

import { Option, SelectTwo } from '../../../components';
import { SelectChangeEvent } from '../../../components/selectTwo/select';

interface Props {
    value: string;
    onChange: (mimeType: CONTACT_MIME_TYPES) => void;
    disabled: boolean;
}

const ContactMIMETypeSelect = ({ value, onChange, disabled }: Props) => {
    const handleChange = ({ value }: SelectChangeEvent<string>) => onChange(value as CONTACT_MIME_TYPES);

    return (
        <SelectTwo value={value} disabled={disabled} onChange={handleChange}>
            <Option title={c('MIME type').t`Automatic`} value={MIME_TYPES_MORE.AUTOMATIC} />
            <Option title={c('MIME type').t`Plain text`} value={MIME_TYPES.PLAINTEXT} />
        </SelectTwo>
    );
};

export default ContactMIMETypeSelect;

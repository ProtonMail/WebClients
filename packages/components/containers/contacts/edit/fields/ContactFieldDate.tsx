import { isValid } from 'date-fns';

import { getDateFromVCardProperty } from '@proton/shared/lib/contacts/property';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { VCardDateOrText, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { DateInput } from '../../../../components';

interface Props {
    vCardProperty: VCardProperty<VCardDateOrText>;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldDate = ({ vCardProperty, onChange, ...rest }: Props) => {
    const label = (getAllFieldLabels() as any)[vCardProperty.field] || '';

    const date = getDateFromVCardProperty(vCardProperty);

    const handleChange = (date?: Date) => {
        if (!date || !isValid(date)) {
            return;
        }

        onChange({ ...vCardProperty, value: { ...vCardProperty.value, date } });
    };

    return <DateInput placeholder={label} value={date} onChange={handleChange} data-testid={label} {...rest} />;
};

export default ContactFieldDate;

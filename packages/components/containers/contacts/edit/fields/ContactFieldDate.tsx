import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { VCardDateOrText, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { isValid } from 'date-fns';
import { DateInput } from '../../../../components';

interface Props {
    vCardProperty: VCardProperty<VCardDateOrText>;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldDate = ({ vCardProperty, onChange, ...rest }: Props) => {
    const label = (getAllFieldLabels() as any)[vCardProperty.field] || '';

    const date = isValid(vCardProperty.value?.date) ? vCardProperty.value.date : new Date();

    const handleChange = (date?: Date) => {
        if (!date || !isValid(date)) {
            return;
        }

        onChange({ ...vCardProperty, value: { ...vCardProperty.value, date } });
    };

    return <DateInput placeholder={label} value={date} onChange={handleChange} data-testid={label} {...rest} />;
};

export default ContactFieldDate;

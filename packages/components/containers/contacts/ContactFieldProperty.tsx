import { getStringContactValue } from '@proton/shared/lib/contacts/properties';
import { ChangeEvent, forwardRef, Ref } from 'react';
import { parseISO, formatISO, isValid } from 'date-fns';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { ContactPropertyChange, ContactValue } from '@proton/shared/lib/interfaces/contacts/Contact';

import { EmailInput, TelInput, DateInput, InputTwo, TextAreaTwo, Input } from '../../components';
import { useModals } from '../../hooks';
import ContactImageModal from './modals/ContactImageModal';
import ContactImageField from './ContactImageField';
import ContactAdrField from './ContactAdrField';

interface Props {
    field: string;
    uid?: string;
    value: ContactValue;
    onChange: (payload: ContactPropertyChange) => void;
    isSubmitted?: boolean;
}

const ContactFieldProperty = (
    { field, value, uid, onChange, isSubmitted = false, ...rest }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const { createModal } = useModals();
    const labels: { [key: string]: string } = getAllFieldLabels();
    const label = labels[field];

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ value: target.value, uid });

    if (field === 'email') {
        return (
            <EmailInput
                value={getStringContactValue(value)}
                placeholder={labels.email}
                onChange={handleChange}
                data-testid={label}
                {...rest}
            />
        );
    }

    if (field === 'tel') {
        return (
            <TelInput value={value} placeholder={labels.tel} onChange={handleChange} data-testid={label} {...rest} />
        );
    }

    if (field === 'adr') {
        const handleChangeAdr = (adr: (string | string[])[]) => onChange({ value: adr, uid });
        return <ContactAdrField value={value} onChange={handleChangeAdr} />;
    }

    if (field === 'note') {
        return (
            <TextAreaTwo
                value={getStringContactValue(value)}
                placeholder={labels.note}
                onChange={handleChange}
                data-testid={label}
                {...rest}
            />
        );
    }

    if (field === 'bday' || field === 'anniversary') {
        const date = value === '' ? new Date() : parseISO(`${value}`);
        if (isValid(date)) {
            const handleSelectDate = (value?: Date) => {
                if (!value || !isValid(value)) {
                    return;
                }
                onChange({ value: formatISO(value, { representation: 'date' }), uid });
            };
            return (
                <DateInput placeholder={label} value={date} onChange={handleSelectDate} data-testid={label} {...rest} />
            );
        }
    }

    if (field === 'photo' || field === 'logo') {
        const handleChangeImage = () => {
            const handleSubmit = (value: string) => onChange({ uid, value });
            createModal(<ContactImageModal url={getStringContactValue(value)} onSubmit={handleSubmit} />);
        };
        return (
            <ContactImageField
                value={getStringContactValue(value)}
                onChange={handleChangeImage}
                data-testid={label}
                {...rest}
            />
        );
    }

    if (field === 'fn') {
        return (
            <Input
                ref={ref}
                value={getStringContactValue(value)}
                placeholder={label}
                onChange={handleChange}
                isSubmitted={isSubmitted}
                data-testid={label}
                required
                {...rest}
            />
        );
    }

    return (
        <InputTwo
            value={getStringContactValue(value)}
            placeholder={label}
            onChange={handleChange}
            data-testid={label}
            {...rest}
        />
    );
};

export default forwardRef(ContactFieldProperty);

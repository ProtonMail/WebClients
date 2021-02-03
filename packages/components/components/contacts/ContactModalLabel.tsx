import React, { ChangeEvent } from 'react';

import { getOtherInformationFields, getAllTypes } from 'proton-shared/lib/helpers/contacts';
import { ContactPropertyChange } from 'proton-shared/lib/interfaces/contacts/Contact';

import ContactLabelProperty from './ContactLabelProperty';
import Label from '../label/Label';
import Select from '../select/Select';

interface Props {
    field: string;
    uid?: string;
    type?: string;
    onChange: (payload: ContactPropertyChange) => void;
}

const ContactModalLabel = ({ field, uid, type = '', onChange }: Props) => {
    const types: { [key: string]: { text: string; value: string }[] } = getAllTypes();
    const fieldType = types[field];

    const otherInformationFields = getOtherInformationFields();

    const handleChangeType = ({ target }: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        onChange({ value: target.value, key: 'type', uid });
    const handleChangeField = ({ target }: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        onChange({ value: target.value, key: 'field', uid });

    if (otherInformationFields.map(({ value: f }) => f).includes(field)) {
        return (
            <Label className="pt0 mr1 on-mobile-w100">
                <Select value={field} options={otherInformationFields} onChange={handleChangeField} />
            </Label>
        );
    }

    if (field === 'fn' || !fieldType.map(({ value: type }) => type).includes(type)) {
        return <ContactLabelProperty field={field} type={type} />;
    }

    return (
        <Label className="pt0 mr1 on-mobile-w100">
            <Select value={type} options={fieldType} onChange={handleChangeType} />
        </Label>
    );
};

export default ContactModalLabel;

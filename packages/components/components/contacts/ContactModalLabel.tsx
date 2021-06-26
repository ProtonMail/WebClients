import React, { ChangeEvent } from 'react';

import { getOtherInformationFields, getAllTypes } from '@proton/shared/lib/helpers/contacts';
import { ContactPropertyChange } from '@proton/shared/lib/interfaces/contacts/Contact';

import ContactLabelProperty from './ContactLabelProperty';
import Label from '../label/Label';
import Select from '../select/Select';

interface Props {
    field: string;
    uid?: string;
    type?: string;
    onChange: (payload: ContactPropertyChange) => void;
    /**
     * fixedType means you don't want to change the type of data (ie: no select)
     */
    fixedType?: boolean;
    /**
     * list of types not to propose in the other information fields
     * mostly useful not to propose second instance of fields limited to one entry in vcards
     */
    filteredTypes?: string[];
}

const ContactModalLabel = ({ field, uid, type = '', onChange, fixedType = false, filteredTypes = [] }: Props) => {
    const types: { [key: string]: { text: string; value: string }[] } = getAllTypes();
    const fieldType = types[field];

    const otherInformationFields = getOtherInformationFields();

    const handleChangeType = ({ target }: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        onChange({ value: target.value, key: 'type', uid });
    const handleChangeField = ({ target }: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        onChange({ value: target.value, key: 'field', uid });

    if (!fixedType && otherInformationFields.map(({ value: f }) => f).includes(field)) {
        const filteredOtherInformationFields = otherInformationFields.filter(
            (field) => !filteredTypes.includes(field.value)
        );

        return (
            <Label className="pt0 mr1 on-mobile-w100">
                <Select value={field} options={filteredOtherInformationFields} onChange={handleChangeField} />
            </Label>
        );
    }

    if (field === 'fn' || fixedType || !fieldType.map(({ value: type }) => type).includes(type)) {
        return <ContactLabelProperty className="pt0-5" field={field} type={type} />;
    }

    return (
        <Label className="pt0 mr1 on-mobile-w100">
            <Select value={type} options={fieldType} onChange={handleChangeType} />
        </Label>
    );
};

export default ContactModalLabel;

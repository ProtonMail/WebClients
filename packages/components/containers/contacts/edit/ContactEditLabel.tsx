import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { getAllTypes, getOtherInformationFields } from '@proton/shared/lib/helpers/contacts';
import type { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { Label } from '../../../components';
import type { SelectChangeEvent } from '../../../components/selectTwo/select';
import ContactLabelProperty from '../view/ContactLabelProperty';

interface Props {
    vCardProperty: VCardProperty;
    onChangeVCard: (vCardProperty: VCardProperty) => void;
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

const ContactEditLabel = ({ vCardProperty, onChangeVCard, fixedType = false, filteredTypes = [] }: Props) => {
    const { field } = vCardProperty;

    const types = getAllTypes();
    const fieldTypes = types[field];
    const type = vCardProperty.params?.type || '';
    const fieldsToReset = ['bday', 'anniversary', 'photo', 'logo'];

    const otherInformationFields = getOtherInformationFields();

    const handleChangeType = ({ value }: SelectChangeEvent<string>) => {
        onChangeVCard({ ...vCardProperty, params: { ...vCardProperty.params, type: value } });
    };
    const handleChangeField = ({ value }: SelectChangeEvent<string>) => {
        let maybeResetValue = {};
        if (fieldsToReset.includes(vCardProperty.field) || value.includes(vCardProperty.field)) {
            maybeResetValue = { value: undefined };
        }
        onChangeVCard({ ...vCardProperty, field: value, ...maybeResetValue });
    };

    if (!fixedType && otherInformationFields.map(({ value: f }) => f).includes(field)) {
        const selectedField = otherInformationFields.find((otherField) => otherField.value === field);
        const filteredOtherInformationFields = otherInformationFields.filter(
            (field) => !filteredTypes.includes(field.value)
        );

        return (
            <Label className="pt-0 md:mr-6 w-full">
                <SelectTwo
                    value={field}
                    onChange={handleChangeField}
                    title={selectedField?.text}
                    data-testid="create-contact:other-info-select"
                >
                    {filteredOtherInformationFields.map((field) => (
                        <Option
                            data-testid={`create-contact:dropdown-item-${field.text}`}
                            key={field.value}
                            title={field.text}
                            value={field.value}
                        />
                    ))}
                </SelectTwo>
            </Label>
        );
    }

    if (field === 'fn' || field === 'n' || fixedType || !fieldTypes.map(({ value: type }) => type).includes(type)) {
        return <ContactLabelProperty className="pt-2" field={field} type={type} />;
    }

    const selectedType = fieldTypes.find((fieldType) => fieldType.value === type) || fieldTypes[0];

    return (
        <Label className="pt-0 md:mr-6 w-full">
            <SelectTwo value={type} onChange={handleChangeType} title={selectedType.text}>
                {fieldTypes.map((fieldType) => (
                    <Option key={fieldType.value} title={fieldType.text} value={fieldType.value} />
                ))}
            </SelectTwo>
        </Label>
    );
};

export default ContactEditLabel;

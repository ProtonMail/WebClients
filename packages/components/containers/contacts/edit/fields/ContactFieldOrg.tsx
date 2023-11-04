import { ChangeEvent, Ref, forwardRef } from 'react';

import { Input, InputProps } from '@proton/atoms';
import { getAllFieldLabels } from '@proton/shared/lib/helpers/contacts';
import { VCardOrg, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import isTruthy from '@proton/utils/isTruthy';

interface Props extends Omit<InputProps, 'onChange'> {
    vCardProperty: VCardProperty<VCardOrg>;
    onChange: (vCardProperty: VCardProperty<VCardOrg>) => void;
}

const ContactFieldOrg = ({ vCardProperty, onChange, ...rest }: Props, ref: Ref<HTMLInputElement>) => {
    const label = getAllFieldLabels().org;

    const property = vCardProperty;
    const value = `${[
        property.value?.organizationalName ?? '',
        ...(property.value?.organizationalUnitNames ?? []),
    ].join(';')}`;

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        const isBackspace = value.length > target.value.length;

        let splitted = target.value.split(';');
        splitted = isBackspace ? splitted.filter(isTruthy) : splitted;

        const [organizationalName, ...organizationalUnitNames] = splitted;

        const newValue = {
            organizationalName,
            organizationalUnitNames,
        };

        onChange({ ...vCardProperty, value: newValue });
    };

    return <Input ref={ref} value={value} placeholder={label} onChange={handleChange} data-testid={label} {...rest} />;
};

export default forwardRef(ContactFieldOrg);

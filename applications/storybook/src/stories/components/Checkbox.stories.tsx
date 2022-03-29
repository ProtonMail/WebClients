import { useState } from 'react';
import { Checkbox, InputFieldTwo } from '@proton/components';
import { getTitle } from '../../helpers/title';

import mdx from './Checkbox.mdx';

export default {
    component: Checkbox,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [isChecked, setIsChecked] = useState(false);

    return <Checkbox checked={isChecked} onChange={() => setIsChecked(!isChecked)} />;
};

export const AsInputField = () => {
    const [checked, setChecked] = useState(false);

    return <InputFieldTwo as={Checkbox} label="Checkbox" checked={checked} onChange={() => setChecked(!checked)} />;
};

import { useState } from 'react';
import { Checkbox, Label } from '@proton/components';
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

    return (
        <Label htmlFor="basicCheckbox">
            <Checkbox id="basicCheckbox" checked={isChecked} onChange={() => setIsChecked(!isChecked)} />
            Basic checkbox
        </Label>
    );
};

import { useState } from 'react';

import { Checkbox, InputFieldTwo, Label } from '@proton/components';

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
    return (
        <div>
            Whachu wanna eat?
            <Label htmlFor="chicken" className="block mb1 mt1">
                <Checkbox id="chicken" />
                Chicken
            </Label>
            <Label htmlFor="spaghetti" className="block mb1">
                <Checkbox id="spaghetti" />
                Spaghetti
            </Label>
            <Label htmlFor="upsetti" className="block">
                <Checkbox id="upsetti" />
                Upsetti
            </Label>
        </div>
    );
};

export const AsInputField = () => {
    const [checked, setChecked] = useState(false);

    return <InputFieldTwo as={Checkbox} label="Checkbox" checked={checked} onChange={() => setChecked(!checked)} />;
};

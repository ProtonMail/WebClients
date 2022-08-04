import { useState } from 'react';

import { Checkbox, InputFieldTwo, Label, useLoading } from '@proton/components';
import { wait } from '@proton/shared/lib/helpers/promise';

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
            <Label htmlFor="tofu" className="block mb1 mt1">
                <Checkbox id="tofu" />
                Tofu
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

export const Loading = () => {
    const [isChecked, setIsChecked] = useState(false);
    const [loading, withLoading] = useLoading(false);

    return (
        <Checkbox
            id="checkbox-loading"
            checked={isChecked}
            loading={loading}
            onChange={() => {
                const run = async () => {
                    await wait(1000);
                    setIsChecked((old) => !old);
                };
                void withLoading(run());
            }}
        />
    );
};

export const Colors = () => {
    return (
        <div>
            <Label htmlFor="red" className="block">
                <Checkbox
                    id="red"
                    backgroundColor="rgb(255, 50, 50)"
                    borderColor="rgb(200, 80, 80)"
                    color="rgb(255, 255, 255)"
                />
                I'm red
            </Label>
        </div>
    );
};

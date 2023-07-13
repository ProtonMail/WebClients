import { useState } from 'react';

import { Checkbox, InputFieldTwo } from '@proton/components';
import { useLoading } from '@proton/hooks';
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
            <div className="my-4">
                <Checkbox id="tofu">Tofu</Checkbox>
            </div>
            <div className="my-4">
                <Checkbox id="spaghetti" checked>
                    Spaghetti
                </Checkbox>
            </div>
            <div className="my-4">
                <Checkbox id="upsetti" checked disabled>
                    Upsetti
                </Checkbox>
            </div>
            <div className="my-4">
                <Checkbox id="overflow">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </Checkbox>
            </div>
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
        >
            Tofu
        </Checkbox>
    );
};

export const Colors = () => {
    return (
        <Checkbox id="red" backgroundColor="rgb(255, 50, 50)" borderColor="rgb(200, 80, 80)" color="rgb(255, 255, 255)">
            I'm red
        </Checkbox>
    );
};

export const Indeterminate = () => {
    return (
        <Checkbox id="Indeterminate" indeterminate>
            I'm Indeterminate
        </Checkbox>
    );
};

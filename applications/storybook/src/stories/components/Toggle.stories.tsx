import { useState } from 'react';

import { InputFieldTwo, Toggle } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { wait } from '@proton/shared/lib/helpers/promise';

import { getTitle } from '../../helpers/title';
import mdx from './Toggle.mdx';

export default {
    component: Toggle,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [isChecked, setIsChecked] = useState(true);
    return (
        <Toggle
            id="toggle-basic"
            checked={isChecked}
            onChange={() => {
                setIsChecked(!isChecked);
            }}
        />
    );
};

export const Label = () => {
    const [isChecked, setIsChecked] = useState(true);
    return (
        <>
            <Toggle
                id="toggle-label"
                checked={isChecked}
                onChange={() => {
                    setIsChecked(!isChecked);
                }}
            >
                This is a label
            </Toggle>
        </>
    );
};

export const Loading = () => {
    const [isChecked, setIsChecked] = useState(false);
    const [loading, withLoading] = useLoading(false);

    return (
        <Toggle
            id="toggle-loading"
            checked={isChecked}
            loading={loading}
            onChange={() => {
                const run = async () => {
                    await wait(500);
                    setIsChecked((old) => !old);
                };
                void withLoading(run());
            }}
        />
    );
};

export const Disabled = () => {
    return (
        <>
            <Toggle id="toggle-disabled-unchecked" disabled className="mr-4" />
            <Toggle id="toggle-disabled-checked" checked disabled />
        </>
    );
};

export const AsInputField = () => {
    const [checked, setChecked] = useState(false);

    return <InputFieldTwo as={Toggle} label="Toggle" checked={checked} onChange={() => setChecked(!checked)} />;
};

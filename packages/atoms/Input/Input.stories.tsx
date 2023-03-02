import { useState } from 'react';

import { Icon, Option, SelectTwo } from '@proton/components';

import { Input } from './Input';
import mdx from './Input.mdx';

export default {
    component: Input,
    title: 'components/Input',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => {
    const [value, setValue] = useState('');

    const handleValue = (updatedValue: string) => setValue(updatedValue);

    return <Input placeholder="Placeholder" value={value} onValue={handleValue} />;
};

export const Controlled = () => {
    const [value, setValue] = useState('');

    const handleValue = (updatedValue: string) => setValue(updatedValue);

    return (
        <>
            <Input placeholder="Placeholder" value={value} onValue={handleValue} />

            <p className="mb-1">
                The `disableChange` prop can be used to prevent the input value from updating. Try updating the value
                from the input below.
            </p>
            <Input disableChange placeholder="Placeholder" value={value} onValue={handleValue} />
        </>
    );
};

export const Error = () => {
    return <Input error />;
};

export const Disabled = () => {
    return (
        <>
            <Input disabled />
            <p className="mb-1">Note the disabled styling added to the prefix and suffix</p>
            <Input disabled prefix={<Icon name="magnifier" />} suffix="@protonmail.com" />
        </>
    );
};

export const Unstyled = () => {
    return <Input unstyled prefix={<Icon name="magnifier" />} placeholder="Search" />;
};

export const Adornments = () => {
    return (
        <>
            <Input className="mb-2" prefix={<Icon name="magnifier" />} />
            <Input className="mb-2" placeholder="**** **** **** ****" suffix={<Icon name="credit-card" />} />
            <Input className="mb-2" placeholder="username" suffix="@protonmail.com" />
            <Input
                className="mb-2"
                placeholder="username"
                suffix={
                    <SelectTwo unstyled value="pm.me">
                        <Option key="pm.me" value="pm.me" title="pm.me">
                            @pm.me
                        </Option>
                        <Option key="protonmail.com" value="protonmail.com" title="protonmail.com">
                            @protonmail.com
                        </Option>
                    </SelectTwo>
                }
            />
        </>
    );
};

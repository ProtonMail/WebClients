import { useState } from 'react';
import {
    Checkbox,
    ColorPicker,
    Icon,
    InputFieldTwo,
    Option,
    PasswordInputTwo,
    PhoneInput,
    SelectTwo,
    TextAreaTwo,
    Toggle,
} from '@proton/components';
import { getTitle } from '../../helpers/title';

import mdx from './InputField.mdx';

export default {
    component: InputFieldTwo,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = ({ ...args }) => <InputFieldTwo {...args} />;
Basic.args = {
    id: 'basic-input',
    label: 'Basic input',
    hint: undefined,
    assistiveText: undefined,
    disabled: false,
    bigger: false,
    error: undefined,
    warning: undefined,
    rootClassName: undefined,
};
Basic.argTypes = {
    label: {
        type: { name: 'string' },
    },
    hint: {
        type: { name: 'string' },
    },
    assistiveText: {
        type: { name: 'string' },
    },
    error: {
        type: { name: 'string' },
    },
    warning: {
        type: { name: 'string' },
    },
    as: {
        table: {
            disable: true,
        },
    },
};

export const Intermediate = () => {
    const [value, setValue] = useState('');
    const placeholder = "e.g. 'John Fitzgerald'";

    return (
        <>
            <InputFieldTwo label="Placeholder" placeholder={placeholder} />
            <InputFieldTwo label="Hint" hint={`${value.length}/100`} value={value} onValue={setValue} />
            <div className="mb1">
                <InputFieldTwo label="Assistive Text" assistiveText="Your legal surname/s (separated by spaces)" />
            </div>
            <InputFieldTwo
                disabled
                label="Disabled"
                placeholder={placeholder}
                assistiveText="Your legal surname/s (separated by spaces)"
            />
        </>
    );
};

export const Validation = () => {
    const sharedInputProps = {
        placeholder: "e.g. 'John Fitzgerald'",
    };

    return (
        <>
            <div className="mb1">
                <InputFieldTwo
                    label="Warning as string"
                    warning="Something's not quite right here"
                    {...sharedInputProps}
                />
            </div>
            <div className="mb1">
                <InputFieldTwo
                    label="Error as string"
                    error="Something's definitely not right here"
                    {...sharedInputProps}
                />
            </div>
            <div className="mb1">
                <InputFieldTwo
                    label="Warning as boolean"
                    warning
                    assistiveText="Should be hidden"
                    {...sharedInputProps}
                />
            </div>
            <div>
                <InputFieldTwo label="Error as boolean" error assistiveText="Should be hidden" {...sharedInputProps} />
            </div>
        </>
    );
};

export const Adornments = () => {
    return (
        <>
            <InputFieldTwo label="Input with icon prefix" prefix={<Icon name="magnifier" />} />
            <InputFieldTwo label="Input with text prefix" prefix="Prefix" />
            <InputFieldTwo
                label="Input with icon suffix"
                placeholder="**** **** **** ****"
                suffix={<Icon name="credit-card" />}
            />
            <InputFieldTwo label="Input with text suffix" placeholder="username" suffix="@protonmail.com" />
            <InputFieldTwo
                label="Input with select suffix"
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

export const Sizes = () => {
    const sharedInputProps = {
        placeholder: "e.g. 'John Fitzgerald'",
    };

    return (
        <>
            <InputFieldTwo label="Default" {...sharedInputProps} />
            <InputFieldTwo label="Bigger" bigger {...sharedInputProps} />
        </>
    );
};

export const Dense = () => {
    const [values, setValues] = useState({ warning: '', error: '', assistive: '' });
    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setValues((prev) => ({
            ...prev,
            [key]: e.target.value,
        }));

    return (
        <>
            <InputFieldTwo
                dense
                value={values.warning}
                onChange={handleChange('warning')}
                label="Warning"
                warning="I'm a warning"
            />
            <InputFieldTwo
                dense
                value={values.error}
                onChange={handleChange('error')}
                label="Error"
                error="I'm an error"
            />
            <InputFieldTwo
                dense
                value={values.assistive}
                onChange={handleChange('assistive')}
                label="Assistive text"
                assistiveText="I'm invisible"
            />
        </>
    );
};

export const CustomElements = () => {
    const [phone, setPhone] = useState('');
    const [color, setColor] = useState('');
    const [toggleChecked, setToggleChecked] = useState(false);
    const [checked, setChecked] = useState(false);

    return (
        <>
            <InputFieldTwo as={PasswordInputTwo} label="Password input" placeholder="Password" />
            <InputFieldTwo
                as={PhoneInput}
                label="Phone input"
                placeholder="Phone number"
                value={phone}
                onChange={setPhone}
            />
            <InputFieldTwo as={TextAreaTwo} rows={3} label="Text area" placeholder="Placeholder" />
            <InputFieldTwo as={SelectTwo} label="Select" placeholder="Placeholder">
                <Option title="one" value="one" />
                <Option title="two" value="two" />
                <Option title="three" value="three" />
            </InputFieldTwo>
            <InputFieldTwo
                as={Toggle}
                label="Toggle"
                checked={toggleChecked}
                onChange={() => setToggleChecked(!toggleChecked)}
            />
            <InputFieldTwo as={Checkbox} label="Checkbox" checked={checked} onChange={() => setChecked(!checked)} />
            <InputFieldTwo
                as={ColorPicker}
                label="Color picker"
                placeholder="Placeholder"
                color={color}
                onChange={setColor}
            />
        </>
    );
};

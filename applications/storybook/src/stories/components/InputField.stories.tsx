import { useState } from 'react';
import {
    Button,
    Checkbox,
    ColorPicker,
    Icon,
    InputFieldTwo,
    Option,
    PasswordInputTwo,
    PhoneInput,
    RadioGroup,
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

export const Basic = () => (
    <InputFieldTwo
        label="What this input field is about"
        hint="Any hint on filling this input field"
        assistiveText="Assistive text explaining how to fill this input field…"
        placeholder="Ex: example of a correct filling…"
        title="Help displayed on hovering this input field, and read by screen readers too."
        prefix={<Icon name="robot" />}
    />
);

const toggles = ['dense', 'bigger', 'unstyled', 'disabled'] as const;

const adornmentIds = ['none', 'text', 'select', 'icon', 'icons', 'icon button'] as const;

export const Sandbox = () => {
    const [label, setLabel] = useState<string>('Label');
    const [hint, setHint] = useState<string>('Hint');
    const [placeholder, setPlaceholder] = useState<string>('Placeholder');
    const [assistiveText, setAssistiveText] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [warning, setWarning] = useState<string>('');
    const [selectedSuffixId, setSelectedSuffixId] = useState<string>('none');
    const [selectedPrefixId, setSelectedPrefixId] = useState<string>('none');
    const [selectedToggles, setSelectedToggles] = useState(toggles.map(() => false));

    const getAdornment = (id: string) => {
        if (id === 'text') {
            return 'text adornment';
        }

        if (id === 'icon') {
            return <Icon name="brand-proton" />;
        }

        if (id === 'icons') {
            return (
                <>
                    <Icon name="brand-proton-mail" />
                    <Icon name="brand-proton-calendar" />
                </>
            );
        }

        if (id === 'icon button') {
            return (
                <Button
                    onClick={() => {
                        alert('Clicked!');
                    }}
                    shape="ghost"
                    size="small"
                    icon
                    className="rounded-sm"
                    disabled={selectedToggles[toggles.indexOf('disabled')]}
                >
                    <Icon name="brand-proton" />
                </Button>
            );
        }

        if (id === 'select') {
            return (
                <SelectTwo unstyled value="Item 1" disabled={selectedToggles[toggles.indexOf('disabled')]}>
                    <Option key="1" value="Item 1" title="Item 1">
                        Item 1
                    </Option>
                    <Option key="2" value="Item 2" title="Item 2">
                        Item 2
                    </Option>
                </SelectTwo>
            );
        }
    };

    return (
        <>
            <div className="flex flex-item-fluid flex-align-items-center flex-justify-center border p2">
                <InputFieldTwo
                    label={label}
                    hint={hint}
                    assistiveText={assistiveText}
                    placeholder={placeholder}
                    error={error}
                    warning={warning}
                    prefix={getAdornment(selectedPrefixId)}
                    suffix={getAdornment(selectedSuffixId)}
                    {...selectedToggles.reduce<{ [key: string]: boolean }>((acc, value, i) => {
                        acc[toggles[i]] = value;
                        return acc;
                    }, {})}
                />
            </div>
            <div className="flex flex-nowrap flex-gap-2 py2">
                <div className="w25">
                    <InputFieldTwo label="Label" value={label} onValue={setLabel} />
                    <InputFieldTwo label="Hint" value={hint} onValue={setHint} />
                    <InputFieldTwo label="Placeholder" value={placeholder} onValue={setPlaceholder} />
                </div>
                <div className="w25">
                    <InputFieldTwo label="AssistiveText" value={assistiveText} onValue={setAssistiveText} />
                    <InputFieldTwo label="Error" value={error} onValue={setError} />
                    <InputFieldTwo label="Warning" value={warning} onValue={setWarning} />
                </div>
                <div>
                    <strong className="block mb1">Prefix</strong>
                    <RadioGroup
                        name="selected-prefix"
                        value={selectedPrefixId}
                        onChange={setSelectedPrefixId}
                        options={adornmentIds.map((suffix) => ({ value: suffix, label: suffix }))}
                    />
                </div>
                <div>
                    <strong className="block mb1">Suffix</strong>
                    <RadioGroup
                        name="selected-suffix"
                        value={selectedSuffixId}
                        onChange={setSelectedSuffixId}
                        options={adornmentIds.map((suffix) => ({ value: suffix, label: suffix }))}
                    />
                </div>
                <div>
                    <strong className="block mb1">Toggles</strong>
                    {toggles.map((prop, i) => {
                        return (
                            <div className="mb0-5">
                                <Checkbox
                                    checked={selectedToggles[i]}
                                    onChange={({ target: { checked } }) => {
                                        setSelectedToggles(
                                            selectedToggles.map((oldValue, otherIndex) =>
                                                otherIndex === i ? checked : oldValue
                                            )
                                        );
                                    }}
                                >
                                    {prop}
                                </Checkbox>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
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
    return (
        <>
            <InputFieldTwo dense label="Warning" warning="I'm a warning" />
            <InputFieldTwo dense label="Error" error="I'm an error" />
            <InputFieldTwo dense label="Assistive text" assistiveText="I'm invisible" />
            <InputFieldTwo dense label="Error with suffix" error="I'm an error" as={PasswordInputTwo} />
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
            <InputFieldTwo as={SelectTwo} label="Select" placeholder="one">
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

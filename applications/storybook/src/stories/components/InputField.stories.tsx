import { useState } from 'react';
import { Icon, InputFieldTwo, PasswordInputTwo } from '@proton/components';
import mdx from './InputField.mdx';

export default {
    component: InputFieldTwo,
    title: 'Components / InputFieldTwo',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [value, setValue] = useState('');

    const sharedInputProps = {
        value,
        onValue: setValue,
        placeholder: "e.g. 'John Fitzgerald'",
    };

    const hint = `${value.length}/100`;

    return (
        <div>
            <div className="mb1">
                <InputFieldTwo label="Rudimentary" {...sharedInputProps} placeholder={undefined} />
            </div>
            <div className="mb1 mt1">
                <InputFieldTwo label="Hint" hint={hint} {...sharedInputProps} />
            </div>
            <div className="mb1 mt1">
                <InputFieldTwo
                    label="Assistive Text"
                    assistiveText="Your legal surname/s (separated by spaces)"
                    {...sharedInputProps}
                />
            </div>
            <div className="mb1 mt1">
                <InputFieldTwo
                    label="Hint & Assistive Text"
                    hint={hint}
                    assistiveText="Your legal surname/s (separated by spaces)"
                    {...sharedInputProps}
                />
            </div>
            <div className="mb1 mt1">
                <InputFieldTwo
                    label="Error"
                    error="Something's not quite right here"
                    hint={hint}
                    {...sharedInputProps}
                />
            </div>
            <div className="mb1 mt1">
                <InputFieldTwo label="Warning" warning="This value might be wrong" hint={hint} {...sharedInputProps} />
            </div>
            <div className="mb1 mt1">
                <InputFieldTwo
                    label="Warning as boolean"
                    warning
                    assistiveText="Should be hidden"
                    {...sharedInputProps}
                />
            </div>
            <div className="mb1 mt1">
                <InputFieldTwo
                    label="Error as boolean"
                    error
                    assistiveText="Should be hidden"
                    hint={hint}
                    {...sharedInputProps}
                />
            </div>
            <div className="mt1">
                <InputFieldTwo
                    disabled
                    label="Disabled"
                    hint={hint}
                    assistiveText="Your legal surname/s (separated by spaces)"
                    {...sharedInputProps}
                />
            </div>
            <div className="mt1">
                <InputFieldTwo
                    as={PasswordInputTwo}
                    label="Password input"
                    {...sharedInputProps}
                    placeholder="Password"
                />
            </div>
            <div className="mt1">
                <InputFieldTwo
                    label="Input with icon"
                    {...sharedInputProps}
                    placeholder="**** **** **** ****"
                    icon={<Icon name="credit-card" />}
                />
            </div>
            <div className="mt1">
                <InputFieldTwo label="Input with suffix" {...sharedInputProps} suffix="@protonmail.com" />
            </div>
        </div>
    );
};

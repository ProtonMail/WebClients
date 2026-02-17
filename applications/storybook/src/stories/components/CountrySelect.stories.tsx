import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import CountrySelect from '@proton/components/components/country/CountrySelect';
import type { CountryOption } from '@proton/components/components/country/helpers';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';

const options: CountryOption[] = [
    { countryName: 'France', countryCode: 'fr' },
    { countryName: 'Finland', countryCode: 'fi' },
    { countryName: 'Australia', countryCode: 'au' },
    { countryName: 'Belgium', countryCode: 'be' },
    { countryName: 'Switzerland', countryCode: 'ch' },
    { countryName: 'Sweden', countryCode: 'se' },
    { countryName: 'Ireland', countryCode: 'ie' },
    { countryName: 'Norway', countryCode: 'no' },
];

const meta: Meta<typeof CountrySelect> = {
    title: 'Components/Country Select',
    args: {
        options,
    },
    component: CountrySelect,
    parameters: {
        docs: {
            description: {
                component:
                    'A searchable country select dropdown with flag icons. Supports pre-selected options, hints, error states, and disabled state.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof CountrySelect>;

export const Default: Story = {};

export const WithPreSelectedOption: Story = {
    args: {
        preSelectedOption: options[0],
    },
};

export const WithPreSelectedOptionAndDivider: Story = {
    args: {
        preSelectedOption: options[0],
        preSelectedOptionDivider: 'Suggested country',
    },
};

export const WithHint: Story = {
    args: {
        hint: 'Select the country you reside in',
    },
};

export const WithError: Story = {
    args: {
        error: 'Please select a valid country',
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};

export const WithoutLabel: Story = {
    args: {
        label: null,
    },
};

export const InteractivePreSelect: Story = {
    render: () => {
        const [preSelectedOptionDivider, setPreSelectedOptionDivider] = useState('');
        const [hint, setHint] = useState('');

        return (
            <>
                <div className="flex flex-1 items-center justify-center border p-7">
                    <CountrySelect
                        options={options}
                        preSelectedOption={options[0]}
                        preSelectedOptionDivider={preSelectedOptionDivider || undefined}
                        hint={hint}
                    />
                </div>
                <div className="flex flex-nowrap gap-7 py-7">
                    <InputFieldTwo
                        label="Divider"
                        placeholder="Change the pre-selected option divider text"
                        value={preSelectedOptionDivider}
                        onValue={(value: string) => setPreSelectedOptionDivider(value)}
                    />
                    <InputFieldTwo
                        label="Hint"
                        placeholder="Add a hint to the select"
                        value={hint}
                        onValue={(value: string) => setHint(value)}
                    />
                </div>
            </>
        );
    },
};

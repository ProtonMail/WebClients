import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { InputField } from '@proton/components/components/v2/field/InputField';

const meta: Meta<typeof InputField> = {
    title: 'Components/InputField',
    argTypes: {
        label: {
            control: 'text',
        },
        hint: {
            control: 'text',
        },
        assistiveText: {
            control: 'text',
        },
    },
    component: InputField,
    parameters: {
        docs: {
            description: {
                component: 'Generally used to display a label, hint, assistive text, and an input field.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof InputField>;

export const Default: Story = {
    args: {
        assistiveText: 'Assistive text',
        hint: 'Hint',
        label: 'Label',
        placeholder: 'Placeholder',
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
        placeholder: 'Placeholder',
    },
};

export const Bigger: Story = {
    args: {
        bigger: true,
        placeholder: 'Placeholder',
    },
};

export const Dense: Story = {
    args: {
        dense: true,
        placeholder: 'Placeholder',
    },
};

export const Error: Story = {
    args: {
        error: true,
        placeholder: 'Placeholder',
    },
};

export const Warning: Story = {
    args: {
        placeholder: 'Placeholder',
        warning: true,
    },
};

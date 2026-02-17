import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Details from '@proton/components/components/container/Details';
import Summary from '@proton/components/components/container/Summary';

const meta: Meta<typeof Details> = {
    title: 'Components/Details',
    component: Details,
    parameters: {
        docs: {
            description: {
                component:
                    'A wrapper around the native HTML details element. Used with the Summary subcomponent to create expandable content sections.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Details>;

export const Default: Story = {
    render: (args) => (
        <Details {...args}>
            <Summary>Here a summary</Summary>
            Lorem Ipsum dolor si amet.
        </Details>
    ),
};

export const Opened: Story = {
    render: () => (
        <Details open>
            <Summary>Here a summary opened</Summary>
            Lorem Ipsum dolor si amet.
        </Details>
    ),
};

export const WithTriangleIcon: Story = {
    render: () => (
        <Details>
            <Summary useTriangle>Here a summary with triangle icon</Summary>
            Lorem Ipsum dolor si amet.
        </Details>
    ),
};

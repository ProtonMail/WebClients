import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
    BorderedContainer,
    BorderedContainerItem,
} from '@proton/components/components/BorderedStackedGroup/BorderedContainer';

const meta: Meta<typeof BorderedContainer> = {
    title: 'Components/BorderedContainer',
    component: BorderedContainer,
    parameters: {
        docs: {
            description: {
                component: 'BorderedContainer component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof BorderedContainer>;

export const Default: Story = {
    render: () => (
        <BorderedContainer>
            <BorderedContainerItem>Item 1</BorderedContainerItem>
            <BorderedContainerItem>Item 2</BorderedContainerItem>
        </BorderedContainer>
    ),
};

export const SimpleExampleWithTwoItemsAndMorePadding: Story = {
    render: () => (
        <BorderedContainer>
            <BorderedContainerItem paddingClassName="py-8 px-10">Item 1</BorderedContainerItem>
            <BorderedContainerItem paddingClassName="py-8 px-10">Item 2</BorderedContainerItem>
        </BorderedContainer>
    ),
};

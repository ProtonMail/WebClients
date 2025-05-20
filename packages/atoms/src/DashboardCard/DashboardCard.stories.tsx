import type { Meta, StoryObj } from '@storybook/react';

import { DashboardCard } from '..';

const meta: Meta<typeof DashboardCard> = {
    args: {
        children: `
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempore ipsa dolores delectus fugit
            consequuntur impedit velit officia tenetur, magni placeat, voluptatum porro unde repudiandae cum
            explicabo assumenda distinctio, mollitia voluptate.
        `,
        rounded: 'xl',
    },
    argTypes: {
        rounded: {
            control: 'radio',
            description: 'Rounded corners for the card.',
            options: [true, false, 'md', 'lg', 'xl'],
        },
    },
    component: DashboardCard,
    parameters: {
        docs: {
            description: {
                component: `This component currently is a container with a bit of styling adhering to a "card / surface" concept, however design is pending on this so for now we're only adding this thin layer, no other card-related components or logic.`,
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof DashboardCard>;

export const Default: Story = {
    render: (args) => (
        <div className="bg-weak p-8">
            <DashboardCard {...args} />
        </div>
    ),
};

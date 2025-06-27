import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../Button/Button';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
    args: {
        background: true,
        bordered: true,
        children: `Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit doloribus nobis eos iusto. Ducimus numquam laborum
         aliquid culpa! Dolor voluptatem modi inventore error, qui repudiandae consequatur autem vitae illum
         voluptatibus?`,
        padded: true,
        rounded: false,
    },
    component: Card,
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

type Story = StoryObj<typeof Card>;

export const Default: Story = {};

export const CardWithRoundedBorders: Story = {
    args: {
        rounded: true,
    },
};
export const CardWithAction: Story = {
    args: {
        children: (
            <>
                <p className="m-0 mr-8 flex-1">
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempore ipsa dolores delectus fugit
                    consequuntur impedit velit officia tenetur, magni placeat, voluptatum porro unde repudiandae cum
                    explicabo assumenda distinctio, mollitia voluptate.
                </p>
                <Button color="norm">Upgrade</Button>
            </>
        ),
        className: 'flex items-center',
    },
};
export const CardWithoutBackground: Story = {
    args: {
        background: false,
    },
};
export const CardWithoutBorders: Story = {
    args: {
        bordered: false,
    },
};
export const CardWithoutPadding: Story = {
    args: {
        padded: false,
    },
};

import type { Meta, StoryObj } from '@storybook/react';

import { ThemeColor } from '@proton/colors/types';

import { Slider, SliderSizeEnum } from './Slider';

const sortedColors = Object.values(ThemeColor).sort();

const meta: Meta<typeof Slider> = {
    args: {
        color: ThemeColor.Norm,
        marks: false,
        max: 100,
        min: 0,
        step: 1,
        value: 30,
    },
    argTypes: {
        color: {
            control: 'radio',
            options: sortedColors,
        },
    },
    component: Slider,
    parameters: {
        docs: {
            description: {
                component: 'Slider component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {};

export const WithMarks: Story = {
    args: {
        marks: true,
    },
};

export const WithSteps: Story = {
    args: {
        step: 10,
        value: 10,
    },
};

export const AllColors: Story = {
    render: (args) => (
        <div className="flex flex-col gap-8">
            {sortedColors.map((color) => (
                <Slider {...args} key={color} color={color} />
            ))}
        </div>
    ),
};

export const AllSizes: Story = {
    render: (args) => (
        <div className="flex flex-col gap-8">
            {Object.values(SliderSizeEnum)
                .sort()
                .map((size) => (
                    <Slider {...args} key={size} size={size} />
                ))}
        </div>
    ),
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import clsx from '@proton/utils/clsx';

interface BorderBoxProps {
    placement: '' | 'border' | 'border-top' | 'border-right' | 'border-bottom' | 'border-left';
    style: '' | 'solid' | 'border-dashed' | 'border-dotted';
    color: '' | 'border-norm' | 'border-weak' | 'border-primary' | 'border-danger' | 'border-success' | 'border-info';
}

/** Renders a box with the selected border utility classes so the Controls panel can drive it. */
const BorderBox = ({ placement, style, color }: BorderBoxProps) => {
    // 'solid' is the default border style, so no utility class is needed for it
    const classes = clsx(placement, style === 'solid' ? undefined : style, color);
    return (
        <div className="flex flex-column gap-4 items-start">
            <code>{`<div className="${classes}">…</div>`}</code>
            <div className={clsx('inline-block px-4 py-3', classes)}>Lorem ipsum dolor sit amet</div>
        </div>
    );
};

const meta: Meta<typeof BorderBox> = {
    title: 'CSS Utilities/Border',
    component: BorderBox,
    args: {
        placement: 'border-bottom',
        style: 'border-dashed',
        color: 'border-norm',
    },
    argTypes: {
        placement: {
            control: { type: 'radio', labels: { '': 'clear' } },
            options: ['', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left'],
        },
        style: {
            control: { type: 'radio', labels: { '': 'default' } },
            options: ['', 'border-dashed', 'border-dotted'],
        },
        color: {
            control: { type: 'radio', labels: { '': 'default' } },
            options: [
                '',
                'border-norm',
                'border-weak',
                'border-primary',
                'border-danger',
                'border-success',
                'border-info',
            ],
        },
    },
};

export default meta;

type Story = StoryObj<typeof BorderBox>;

/** Interactive: combine a placement, style and color from the Controls panel. */
export const Playground: Story = {};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Icon from '@proton/components/components/icon/Icon';

const meta: Meta<typeof Icon> = {
    title: 'Components/Icon',
    args: {
        name: 'brand-proton-mail',
    },
    component: Icon,
    parameters: {
        docs: {
            description: {
                component:
                    'Icon component renders SVG icons from the Proton icon set. Supports different sizes, colors, and rotation. Icons inherit the parent text color by default.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const AllSizes: Story = {
    render: () => (
        <div className="flex items-end gap-4">
            {([3, 4, 6, 10, 12] as const).map((size) => (
                <Icon key={size} name="brand-proton-mail" size={size} />
            ))}
        </div>
    ),
};

export const WithColors: Story = {
    render: () => {
        const colors = ['primary', 'danger', 'success', 'warning', 'info'];
        const sizes = [3, 4, 6, 10, 12] as const;

        return (
            <div>
                <div className="flex items-end justify-center gap-4 mb-4">
                    {sizes.map((size) => (
                        <Icon key={size} name="brand-proton-mail" size={size} />
                    ))}
                </div>
                {colors.map((color) => (
                    <div key={color} className="flex items-end justify-center gap-4 mb-4">
                        {sizes.map((size) => (
                            <Icon key={size} name="brand-proton-mail" size={size} className={`color-${color}`} />
                        ))}
                    </div>
                ))}
            </div>
        );
    },
};

export const Rotated: Story = {
    args: {
        name: 'arrow-up',
        rotate: 45,
    },
};

export const WithAlt: Story = {
    args: {
        name: 'brand-proton-mail',
        alt: 'Proton Mail icon',
    },
};

export const CustomColor: Story = {
    args: {
        name: 'brand-proton-mail',
        color: 'rgb(107, 76, 217)',
        size: 10,
    },
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { IcArrowUp } from '@proton/icons/icons/IcArrowUp';
import { IcBrandProtonMail } from '@proton/icons/icons/IcBrandProtonMail';

const meta: Meta<typeof IcBrandProtonMail> = {
    title: 'Components/Icon',
    component: IcBrandProtonMail,
    parameters: {
        docs: {
            description: {
                component:
                    'Icons from @proton/icons (for example IcBrandProtonMail) render SVG icons from the Proton icon set. They support sizes, className, and standard SVG attributes. Icons inherit the parent text color by default.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof IcBrandProtonMail>;

export const Default: Story = {};

export const AllSizes: Story = {
    render: () => (
        <div className="flex items-end gap-4">
            {([3, 4, 6, 10, 12] as const).map((size) => (
                <IcBrandProtonMail key={size} size={size} />
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
                        <IcBrandProtonMail key={size} size={size} />
                    ))}
                </div>
                {colors.map((color) => (
                    <div key={color} className="flex items-end justify-center gap-4 mb-4">
                        {sizes.map((size) => (
                            <IcBrandProtonMail key={size} size={size} className={`color-${color}`} />
                        ))}
                    </div>
                ))}
            </div>
        );
    },
};

export const Rotated: Story = {
    render: () => <IcArrowUp style={{ transform: 'rotate(45deg)' }} />,
};

export const WithAlt: Story = {
    args: {
        alt: 'Proton Mail icon',
    },
};

export const CustomColor: Story = {
    args: {
        style: { color: 'rgb(107, 76, 217)' },
        size: 10,
    },
};

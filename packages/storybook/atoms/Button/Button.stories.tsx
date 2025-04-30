import type { Meta, StoryObj } from '@storybook/react';

import { Button, ButtonLikeShapeEnum, ButtonLikeSizeEnum } from '@proton/atoms';
import type { ButtonLikeOwnProps } from '@proton/atoms';
import { ThemeColor } from '@proton/colors';

const meta: Meta<typeof Button> = {
    args: {
        color: ThemeColor.Norm,
        children: 'I am a button',
        'data-testid': '',
        disabled: false,
        fullWidth: false,
        group: false,
        icon: false,
        loading: false,
        noDisabledStyles: false,
        pill: false,
        selected: false,
        shape: ButtonLikeShapeEnum.Solid,
        size: ButtonLikeSizeEnum.Medium,
    },
    component: Button,
    parameters: {
        docs: {
            description: {
                component: 'Button component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};

// Colors
const AllColorsSorted = Object.values(ThemeColor).sort();
const AllColorsWithProps = (props: ButtonLikeOwnProps = {}) => (
    <>
        {AllColorsSorted.map((color: ThemeColor) => (
            <Button key={color} {...props} children={color} color={color} />
        ))}
    </>
);

export const AllColors: Story = {
    render: () => AllColorsWithProps(),
};
export const AllColorsDisabled: Story = {
    render: () => AllColorsWithProps({ disabled: true }),
};
export const AllColorsFullWidth: Story = {
    render: () => AllColorsWithProps({ fullWidth: true }),
};
export const AllColorsAsIcon: Story = {
    render: () => AllColorsWithProps({ icon: true }),
};
export const AllColorsLoading: Story = {
    render: () => AllColorsWithProps({ loading: true }),
};
export const AllColorsPill: Story = {
    render: () => AllColorsWithProps({ pill: true }),
};

// Shapes
const AllShapesSorted = Object.values(ButtonLikeShapeEnum).sort();
const AllShapesWithProps = (props: ButtonLikeOwnProps = {}) => (
    <>
        {AllShapesSorted.map((shape: ButtonLikeShapeEnum) => (
            <Button key={shape} {...props} children={shape} color={ThemeColor.Norm} shape={shape} />
        ))}
    </>
);

export const AllShapes: Story = {
    render: () => AllShapesWithProps(),
};
export const AllShapesDisabled: Story = {
    render: () => AllShapesWithProps({ disabled: true }),
};
export const AllShapesFullWidth: Story = {
    render: () => AllShapesWithProps({ fullWidth: true }),
};
export const AllShapesAsIcon: Story = {
    render: () => AllShapesWithProps({ icon: true }),
};
export const AllShapesLoading: Story = {
    render: () => AllShapesWithProps({ loading: true }),
};
export const AllShapesPill: Story = {
    render: () => AllShapesWithProps({ pill: true }),
};

// Sizes
const AllSizesSorted = Object.values(ButtonLikeSizeEnum).sort();
const AllSizesWithProps = (props: ButtonLikeOwnProps = {}) => (
    <>
        {AllSizesSorted.map((size: ButtonLikeSizeEnum) => (
            <Button key={size} {...props} children={size} color={ThemeColor.Norm} size={size} />
        ))}
    </>
);

export const AllSizes: Story = {
    render: () => AllSizesWithProps(),
};
export const AllSizesDisabled: Story = {
    render: () => AllSizesWithProps({ disabled: true }),
};
export const AllSizesFullWidth: Story = {
    render: () => AllSizesWithProps({ fullWidth: true }),
};
export const AllSizesAsIcon: Story = {
    render: () => AllSizesWithProps({ icon: true }),
};
export const AllSizesLoading: Story = {
    render: () => AllSizesWithProps({ loading: true }),
};
export const AllSizesPill: Story = {
    render: () => AllSizesWithProps({ pill: true }),
};

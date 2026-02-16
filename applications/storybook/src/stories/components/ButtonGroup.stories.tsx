import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLikeShapeEnum, ButtonLikeSizeEnum } from '@proton/atoms/Button/ButtonLike';
import { ButtonGroup } from '@proton/components/components/button/ButtonGroup';

const Buttons = ['One', 'Two', 'Three'].map((text) => <Button key={text}>{text}</Button>);

const meta: Meta<typeof ButtonGroup> = {
    title: 'Components/ButtonGroup',
    args: {
        children: Buttons,
        color: 'weak',
        shape: 'outline',
        size: 'medium',
        pill: false,
        removeBackgroundColorOnGroup: false,
        separators: true,
        individualButtonColor: false,
    },
    component: ButtonGroup,
    parameters: {
        docs: {
            description: {
                component: 'Generally used to display a group of buttons.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {};

export const AllPills: Story = {
    args: {
        pill: true,
    },
};

export const AllSizes: Story = {
    render: () => (
        <>
            {Object.values(ButtonLikeSizeEnum).map((size) => (
                <div className="flex flex-col gap-6 m-6" key={size}>
                    <ButtonGroup key={size} color="norm" size={size}>
                        {[size, size, size].map((text) => (
                            <Button key={text}>{text}</Button>
                        ))}
                    </ButtonGroup>
                </div>
            ))}
        </>
    ),
};

export const AllShapes: Story = {
    render: () => (
        <>
            {Object.values(ButtonLikeShapeEnum).map((shape) => (
                <div className="flex flex-col gap-6 m-6" key={shape}>
                    <ButtonGroup key={shape} color="norm" shape={shape}>
                        {[shape, shape, shape].map((text) => (
                            <Button key={text}>{text}</Button>
                        ))}
                    </ButtonGroup>
                </div>
            ))}
        </>
    ),
};

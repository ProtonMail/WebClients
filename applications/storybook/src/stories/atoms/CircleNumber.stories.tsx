import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { CircledNumber } from '@proton/atoms/CircledNumber/CircledNumber';

const meta: Meta<typeof CircledNumber> = {
    title: 'Atoms/CircledNumber',
    args: {
        number: 1,
    },
    component: CircledNumber,
    parameters: {
        docs: {
            description: {
                component: 'CircledNumber component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof CircledNumber>;

export const Default: Story = {};

const AllVariantsWithProps = (props: any = {}) => (
    <div className="inline-flex flex-row gap-2">
        {Array.from({ length: 9 }, (_, index) => (
            <CircledNumber key={index} number={index + 1} {...props} />
        ))}
    </div>
);

export const AllValues: Story = {
    render: () => AllVariantsWithProps(),
};

export const Number7WithColorClassName: Story = {
    render: () => {
        return (
            <div className="inline-flex flex-row gap-2">
                <CircledNumber number={7} colorClassName="color-danger" />
                <CircledNumber number={7} colorClassName="color-weak" />
                <CircledNumber number={7} colorClassName="color-success" />
                <CircledNumber number={7} colorClassName="color-info" />
            </div>
        );
    },
};

export const Number9WithBiggerTextSize: Story = {
    render: () => <CircledNumber number={9} textSizeClassName="text-sm" />,
};

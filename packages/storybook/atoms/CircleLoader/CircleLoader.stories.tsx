import type { Meta, StoryObj } from '@storybook/react';

import { CircleLoader, CircleLoaderSizeEnum } from '@proton/atoms';
import type { CircleLoaderProps } from '@proton/atoms';

const meta: Meta<typeof CircleLoader> = {
    args: {
        className: 'color-primary',
        size: CircleLoaderSizeEnum.Medium,
        srLabelHidden: true,
    },
    argTypes: {
        size: {
            control: 'radio',
            options: Object.values(CircleLoaderSizeEnum),
        },
    },
    component: CircleLoader,
    parameters: {
        docs: {
            description: {
                component: 'CircleLoader component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof CircleLoader>;

export const Default: Story = {};

// Sizes
const AllSizedSorted = Object.values(CircleLoaderSizeEnum).sort();
const AllSizesWithProps = (props: CircleLoaderProps = {}) => (
    <>
        {AllSizedSorted.map((size: CircleLoaderSizeEnum) => (
            <CircleLoader key={size} {...props} children={size} size={size} />
        ))}
    </>
);

export const AllSizes: Story = {
    render: () => AllSizesWithProps(),
};

// Colors
const ClassNamesSorted = ['', 'color-danger', 'color-primary'];
const ClassNamesWithProps = (props: CircleLoaderProps = {}) => (
    <>
        {ClassNamesSorted.map((className: string) => (
            <CircleLoader key={className} {...props} className={className} size={CircleLoaderSizeEnum.Medium} />
        ))}
    </>
);

export const WithClassNames: Story = {
    render: () => ClassNamesWithProps(),
};

import type { Meta, StoryObj } from '@storybook/react';

import { Scroll } from '..';

const meta: Meta<typeof Scroll> = {
    args: {
        children: (
            <div className="px-4 text-justify">
                <p style={{ maxWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p style={{ maxWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p style={{ maxWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p style={{ maxWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
            </div>
        ),
        className: 'border',
        horizontal: false,
        style: { height: 160 },
    },

    component: Scroll,
    parameters: {
        docs: {
            description: {
                component:
                    'The `Scroll` component is a utility component which makes an area scrollable should its content overflow the maximum dimensions of its parent. It also adds some styling in the form of shadows to indicate to the user that an area is scrollable/has off-screen parts.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Scroll>;

export const Default: Story = {};

export const Horizontal: Story = {
    args: {
        children: (
            <div className="p-4 flex flex-nowrap">
                <p className="pr-7" style={{ minWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p className="pr-7" style={{ minWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p className="pr-7" style={{ minWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
                <p style={{ minWidth: 400 }}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
                    obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero,
                    blanditiis quos?
                </p>
            </div>
        ),
        horizontal: true,
    },
};

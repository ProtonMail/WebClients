import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { TransitionSlot } from '@proton/atoms/TransitionSlot/TransitionSlot';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

const meta: Meta<typeof TransitionSlot> = {
    title: 'Atoms/TransitionSlot',
    component: TransitionSlot,
    parameters: {
        docs: {
            description: {
                component:
                    'A single slot that shows one of several stacked nodes and fades + scales between them as `activeKey` changes. Every item is mounted and overlaid in the same grid cell, so the box sizes to the largest item. Tune the timing with `duration` and the pop-in with `scaleTransitionRatio`; size and colour the content from the consumer side.\n\n' +
                    '**The transition is a fade + scale, not a path-level morph** — it cannot tween one SVG shape into another. It only *reads* as a morph when the items line up visually, e.g. icons sharing the same viewBox and centre (like `CircleLoader` → `IcCheckmarkCircleFilled` in the story below). For unrelated shapes it is an honest crossfade.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof TransitionSlot>;

/** The motivating case: move a loader into a success icon by reusing existing themed components. */
export const LoaderToCheckmark: Story = {
    render: () => {
        const [done, setDone] = useState(false);
        return (
            <div className="flex flex-column items-center gap-4">
                <TransitionSlot
                    activeKey={done ? 'done' : 'loading'}
                    items={{
                        loading: <CircleLoader size="large" />,
                        done: <IcCheckmarkCircleFilled size={12} className="color-success" />,
                    }}
                />
                <Button onClick={() => setDone((value) => !value)}>{done ? 'Reset' : 'Complete'}</Button>
            </div>
        );
    },
};

/** The items are arbitrary — here three plain states, with the timing knobs exposed as controls. */
export const Generic: Story = {
    args: {
        duration: '0.25s',
        scaleTransitionRatio: 0.6,
    },
    argTypes: {
        duration: { control: 'text' },
        scaleTransitionRatio: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
    },
    render: (args) => {
        const [active, setActive] = useState('one');
        return (
            <div className="flex flex-column items-center gap-4">
                <TransitionSlot
                    {...args}
                    activeKey={active}
                    items={{
                        one: <span className="text-4xl text-bold color-primary">A</span>,
                        two: <span className="text-4xl text-bold color-success">B</span>,
                        three: <span className="text-4xl text-bold color-danger">C</span>,
                    }}
                />
                <div className="flex gap-2">
                    {['one', 'two', 'three'].map((key) => (
                        <Button key={key} selected={active === key} onClick={() => setActive(key)}>
                            {key}
                        </Button>
                    ))}
                </div>
            </div>
        );
    },
};

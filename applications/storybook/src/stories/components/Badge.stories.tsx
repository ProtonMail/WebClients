import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Badge, CLASSNAMES } from '@proton/components/components/badge/Badge';
import type { BadgeType } from '@proton/components/components/badge/Badge';
import Toggle from '@proton/components/components/toggle/Toggle';

const meta: Meta<typeof Badge> = {
    title: 'Components/Badge',
    args: {
        children: 'Badge',
        type: 'primary',
    },
    component: Badge,
    parameters: {
        docs: {
            description: {
                component: 'Generally used to display a badge with a type and a tooltip.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const AllTypes: Story = {
    render: () => (
        <div className="flex flex-col gap-8 m-10">
            {Object.keys(CLASSNAMES).map((type) => (
                <Badge key={type} type={type as BadgeType}>
                    {type}
                </Badge>
            ))}
        </div>
    ),
};

export const WithTooltip: Story = {
    args: {
        tooltip: 'Boo!',
        tooltipOpenDelay: 100,
    },
};

export const WithUrl: Story = {
    args: {
        url: 'https://www.proton.ch',
    },
};

export const WithClassName: Story = {
    args: {
        className: 'text-bold',
    },
};

const items = ['first', 'second', 'third'];
export const WithAlignedNumbers: Story = {
    render: () => {
        const [show, setShow] = useState(false);
        return (
            <div className="flex flex-column gap-3">
                <Toggle
                    checked={show}
                    onChange={({ target }) => {
                        setShow(target.checked);
                    }}
                    className="color-weak"
                >
                    {"On  -> adds 'text-tabular-nums' helper"}
                    <br />
                    {"Off -> without 'text-tabular-nums' helper"}
                </Toggle>
                {items.map((item, index) => (
                    <div key={item} className="flex flex-row gap-2">
                        <Badge type="light" className={show ? 'text-tabular-nums' : undefined}>
                            {index + 1}
                        </Badge>
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        );
    },
};

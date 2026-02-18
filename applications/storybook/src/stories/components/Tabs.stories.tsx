import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Checkbox from '@proton/components/components/input/Checkbox';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { Tab } from '@proton/components/components/tabs/Tabs';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import type { IconName } from '@proton/icons/types';

import bulbasaur from '../../assets/bulbasaur.png';
import charmander from '../../assets/charmander.png';
import squirtle from '../../assets/squirtle.png';

const meta: Meta<typeof Tabs> = {
    title: 'Components/Tabs',
    component: Tabs,
    parameters: {
        docs: {
            description: {
                component:
                    'A tabbed interface component. Supports underline and modern variants, full width, contained mode, sticky tabs, and tab icons.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
    render: () => {
        const tabs: Tab[] = [
            {
                title: 'Bulbasaur',
                content: (
                    <>
                        <img src={bulbasaur} alt="Bulbasaur" />
                        <p>
                            There is a plant seed on its back right from the day this Pokemon is born. The seed slowly
                            grows larger.
                        </p>
                    </>
                ),
            },
            {
                title: 'Charmander',
                icon: 'fire' as IconName,
                iconPosition: 'trailing' as const,
                content: (
                    <>
                        <img src={charmander} alt="Charmander" />
                        <p>
                            It has a preference for hot things. When it rains, steam is said to spout from the tip of
                            its tail.
                        </p>
                    </>
                ),
            },
            {
                title: 'Squirtle',
                content: (
                    <>
                        <img src={squirtle} alt="Squirtle" />
                        <p>When it retracts its long neck into its shell, it squirts out water with vigorous force.</p>
                    </>
                ),
            },
        ];
        const [index, setIndex] = useState(0);
        return <Tabs tabs={tabs} value={index} onChange={setIndex} />;
    },
};

export const ModernVariant: Story = {
    render: () => {
        const tabs: Tab[] = [
            {
                title: 'Bulbasaur',
                content: (
                    <div className="p-4">
                        <img src={bulbasaur} alt="Bulbasaur" />
                        <p>
                            There is a plant seed on its back right from the day this Pokemon is born. The seed slowly
                            grows larger.
                        </p>
                    </div>
                ),
            },
            {
                title: 'Charmander',
                content: (
                    <div className="p-4">
                        <img src={charmander} alt="Charmander" />
                        <p>
                            It has a preference for hot things. When it rains, steam is said to spout from the tip of
                            its tail.
                        </p>
                    </div>
                ),
            },
            {
                title: 'Squirtle',
                content: (
                    <div className="p-4">
                        <img src={squirtle} alt="Squirtle" />
                        <p>When it retracts its long neck into its shell, it squirts out water with vigorous force.</p>
                    </div>
                ),
            },
        ];
        const [index, setIndex] = useState(0);
        return <Tabs tabs={tabs} variant="modern" fullWidth value={index} onChange={setIndex} />;
    },
};

const toggles = ['fullWidth', 'contained', 'stickyTabs'] as const;
const variants = ['underline', 'modern'] as const;

export const Sandbox: Story = {
    render: () => {
        const [selectedToggles, setSelectedToggles] = useState(toggles.map(() => false));
        const [selectedVariant, setSelectedVariant] = useState(variants[0]);
        const [index, setIndex] = useState(0);

        const tabs: Tab[] = [
            {
                title: 'Bulbasaur',
                icon: 'exclamation-circle-filled' as IconName,
                iconPosition: 'leading' as const,
                content: (
                    <p>
                        There is a plant seed on its back right from the day this Pokemon is born. The seed slowly grows
                        larger. There is a plant seed on its back right from the day this Pokemon is born. The seed
                        slowly grows larger. There is a plant seed on its back right from the day this Pokemon is born.
                        The seed slowly grows larger.
                    </p>
                ),
            },
            {
                title: 'Charmander',
                content: (
                    <p>
                        It has a preference for hot things. When it rains, steam is said to spout from the tip of its
                        tail.
                    </p>
                ),
            },
            {
                title: 'Squirtle',
                content: (
                    <p>When it retracts its long neck into its shell, it squirts out water with vigorous force.</p>
                ),
            },
        ];

        return (
            <div>
                <div style={{ '--max-h-custom': '10rem' } as React.CSSProperties}>
                    <Tabs
                        tabs={tabs}
                        value={index}
                        onChange={setIndex}
                        variant={selectedVariant}
                        className="overflow-auto max-h-custom"
                        {...selectedToggles.reduce<{ [key: string]: boolean }>((acc, value, i) => {
                            acc[toggles[i]] = value;
                            return acc;
                        }, {})}
                    />
                </div>
                <div className="mt-8 mb-2 w-350">
                    <strong className="block mb-4">Variant</strong>
                    <SelectTwo value={selectedVariant} onChange={(event) => setSelectedVariant(event.value)}>
                        {variants.map((v) => (
                            <Option key={v} title={v} value={v} />
                        ))}
                    </SelectTwo>
                </div>
                <div className="mt-8 mb-14">
                    <strong className="block mb-4">Toggles</strong>
                    {toggles.map((prop, i) => (
                        <div className="mb-2" key={prop}>
                            <Checkbox
                                checked={selectedToggles[i]}
                                onChange={({ target: { checked } }) => {
                                    setSelectedToggles(
                                        selectedToggles.map((oldValue, otherIndex) =>
                                            otherIndex === i ? checked : oldValue
                                        )
                                    );
                                }}
                            >
                                {prop}
                            </Checkbox>
                        </div>
                    ))}
                </div>
            </div>
        );
    },
};

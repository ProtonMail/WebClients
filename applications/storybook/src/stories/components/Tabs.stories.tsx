import { useState } from 'react';

import { Checkbox, Option, SelectTwo, type Tab, Tabs } from '@proton/components';
import type { IconName } from '@proton/icons/types';

import bulbasaur from '../../assets/bulbasaur.png';
import charmander from '../../assets/charmander.png';
import squirtle from '../../assets/squirtle.png';
import mdx from './Tabs.mdx';

export default {
    title: 'Components/Tabs',
    component: Tabs,
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const tabs: Tab[] = [
        {
            title: 'Bulbasaur',
            content: (
                <>
                    <img src={bulbasaur} alt="Bulbasaur" />
                    <p>
                        There is a plant seed on its back right from the day this Pokémon is born. The seed slowly grows
                        larger.
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
                        It has a preference for hot things. When it rains, steam is said to spout from the tip of its
                        tail.
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
};

export const ModernVariant = () => {
    const tabs = [
        {
            title: 'Bulbasaur',
            content: (
                <div className="p-4">
                    <img src={bulbasaur} alt="Bulbasaur" />
                    <p>
                        There is a plant seed on its back right from the day this Pokémon is born. The seed slowly grows
                        larger.
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
                        It has a preference for hot things. When it rains, steam is said to spout from the tip of its
                        tail.
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
};

const toggles = ['fullWidth', 'contained', 'stickyTabs'] as const;
const variant = ['underline', 'modern'] as const;

export const Sandbox = () => {
    const [selectedToggles, setSelectedToggles] = useState(toggles.map(() => false));
    const [selectedVariant, setSelectedVariant] = useState(variant[0]);
    const [index, setIndex] = useState(0);

    const tabs = [
        {
            title: 'Bulbasaur',
            icon: 'exclamation-circle-filled' as IconName,
            iconPosition: 'leading' as const,
            content: (
                <>
                    <p>
                        There is a plant seed on its back right from the day this Pokémon is born. The seed slowly grows
                        larger. There is a plant seed on its back right from the day this Pokémon is born. The seed
                        slowly grows larger. There is a plant seed on its back right from the day this Pokémon is born.
                        The seed slowly grows larger. There is a plant seed on its back right from the day this Pokémon
                        is born. The seed slowly grows larger. There is a plant seed on its back right from the day this
                        Pokémon is born. The seed slowly grows larger. There is a plant seed on its back right from the
                        day this Pokémon is born. The seed slowly grows larger. There is a plant seed on its back right
                        from the day this Pokémon is born. The seed slowly grows larger. There is a plant seed on its
                        back right from the day this Pokémon is born. The seed slowly grows larger. There is a plant
                        seed on its back right from the day this Pokémon is born. The seed slowly grows larger. There is
                        a plant seed on its back right from the day this Pokémon is born. The seed slowly grows larger.
                        There is a plant seed on its back right from the day this Pokémon is born. The seed slowly grows
                        larger. There is a plant seed on its back right from the day this Pokémon is born. The seed
                        slowly grows larger. There is a plant seed on its back right from the day this Pokémon is born.
                        The seed slowly grows larger. There is a plant seed on its back right from the day this Pokémon
                        is born. The seed slowly grows larger. There is a plant seed on its back right from the day this
                        Pokémon is born. The seed slowly grows larger. There is a plant seed on its back right from the
                        day this Pokémon is born. The seed slowly grows larger. There is a plant seed on its back right
                        from the day this Pokémon is born. The seed slowly grows larger. There is a plant seed on its
                        back right from the day this Pokémon is born. The seed slowly grows larger. Sorry, I needed more
                        text.
                    </p>
                </>
            ),
        },
        {
            title: 'Charmander',
            content: (
                <>
                    <p>
                        It has a preference for hot things. When it rains, steam is said to spout from the tip of its
                        tail.
                    </p>
                </>
            ),
        },
        {
            title: 'Squirtle',
            content: (
                <>
                    <p>When it retracts its long neck into its shell, it squirts out water with vigorous force.</p>
                </>
            ),
        },
    ];

    const tabsExample = (
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
        ></Tabs>
    );

    return (
        <div>
            <div style={{ '--max-h-custom': '10rem' }}>{tabsExample}</div>
            <div className="mt-8 mb-2 w-350">
                <strong className="block mb-4">Variant</strong>
                <SelectTwo value={selectedVariant} onChange={(event) => setSelectedVariant(event.value)}>
                    {variant.map((variant) => {
                        return <Option key={variant} title={variant.toString()} value={variant} />;
                    })}
                </SelectTwo>
            </div>
            <div className="mt-8 mb-14">
                <strong className="block mb-4">Toggles</strong>
                {toggles.map((prop, i) => {
                    return (
                        <div className="mb-2">
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
                    );
                })}
            </div>
        </div>
    );
};

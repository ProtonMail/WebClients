import { useState } from 'react';

import { Checkbox, Tabs } from '@proton/components';

import bulbasaur from '../../assets/bulbasaur.png';
import charmander from '../../assets/charmander.png';
import squirtle from '../../assets/squirtle.png';
import { getTitle } from '../../helpers/title';
import mdx from './Tabs.mdx';

export default {
    title: getTitle(__filename, false),
    component: Tabs,
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const tabs = [
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

const toggles = ['fullWidth', 'stickyTabs'] as const;

export const Sandbox = () => {
    const [selectedToggles, setSelectedToggles] = useState(toggles.map(() => false));
    const [index, setIndex] = useState(0);

    const tabs = [
        {
            title: 'Bulbasaur',
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
            className="scroll-if-needed max-h-custom"
            {...selectedToggles.reduce<{ [key: string]: boolean }>((acc, value, i) => {
                acc[toggles[i]] = value;
                return acc;
            }, {})}
        ></Tabs>
    );

    return (
        <div>
            <div style={{ '--max-height-custom': '10rem' }}>{tabsExample}</div>
            <div className="mt2 mb4">
                <strong className="block mb1">Toggles</strong>
                {toggles.map((prop, i) => {
                    return (
                        <div className="mb0-5">
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

import React, { useState } from 'react';
import { Tabs } from '@proton/components';

import mdx from './Tabs.mdx';
import bulbasaur from '../../assets/bulbasaur.png';
import charmander from '../../assets/charmander.png';
import squirtle from '../../assets/squirtle.png';

export default {
    title: 'Components / Tabs',
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

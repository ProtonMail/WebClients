import React, { useState } from 'react';
import {
    PrimaryButton,
    Button,
    ErrorButton,
    WarningButton,
    LinkButton,
    LargeButton,
    SmallButton,
    Group,
    ButtonGroup,
} from 'react-components';

import mdx from './Button.mdx';

export default {
    component: Button,
    title: 'Components / Button',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => (
    <>
        <Button className="mr1">Button</Button>
        <Button className="pm-button--primaryborder mr1">Button</Button>
        <Button className="pm-button--pill mr1">Button</Button>
        <PrimaryButton className="mr1">Button</PrimaryButton>
        <ErrorButton className="mr1">Button</ErrorButton>
        <WarningButton className="mr1">Button</WarningButton>
        <LinkButton>Button link</LinkButton>
    </>
);
export const Size = () => (
    <>
        <SmallButton className="mr1">Small</SmallButton>
        <LargeButton>Large</LargeButton>
    </>
);
export const Grouped = () => {
    const [pokemon, setPokemon] = useState('Bulbasaur');
    return (
        <Group>
            <ButtonGroup className={pokemon === 'Bulbasaur' ? 'is-active' : ''} onClick={() => setPokemon('Bulbasaur')}>
                Bulbasaur
            </ButtonGroup>
            <ButtonGroup
                className={pokemon === 'Charmander' ? 'is-active' : ''}
                onClick={() => setPokemon('Charmander')}
            >
                Charmander
            </ButtonGroup>
            <ButtonGroup className={pokemon === 'Squirtle' ? 'is-active' : ''} onClick={() => setPokemon('Squirtle')}>
                Squirtle
            </ButtonGroup>
        </Group>
    );
};
export const Disabled = () => <Button disabled>Button</Button>;
export const Loading = () => <Button loading>Button</Button>;

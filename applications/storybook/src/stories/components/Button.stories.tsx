import React, { useState } from 'react';
import {
    PrimaryButton,
    Button,
    ButtonProps,
    ErrorButton,
    WarningButton,
    LinkButton,
    LargeButton,
    SmallButton,
    Group,
    ButtonGroup,
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TableBody,
    SelectTwo,
    Option,
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

export const Primary = ({ ...args }) => <Button {...args}>Loremium</Button>;

Primary.args = {};

export const Basic = () => (
    <>
        <Button className="mr1">Button</Button>
        <Button className="button--primaryborder mr1">Button</Button>
        <Button className="button--pill mr1">Button</Button>
        <PrimaryButton className="mr1">Button</PrimaryButton>
        <ErrorButton className="mr1">Button</ErrorButton>
        <WarningButton className="mr1">Button</WarningButton>
        <LinkButton>Button link</LinkButton>
    </>
);

const shapes: Required<ButtonProps>['shape'][] = ['solid', 'outline', 'ghost'];

const colors: Required<ButtonProps>['color'][] = ['norm', 'weak', 'danger', 'warning', 'success', 'info'];

const buttonContainerClassName =
    'flex flex-item-fluid flex-align-items-center flex-justify-center bg-global-light ml2 rounded';

export const New = () => {
    const [selectedShape, setSelectedShape] = useState<Required<ButtonProps>['shape']>('solid');
    const [selectedColor, setSelectedColor] = useState<Required<ButtonProps>['color']>('norm');

    const button = (
        <Button shape={selectedShape} color={selectedColor}>
            {selectedShape} {selectedColor}
        </Button>
    );

    return (
        <div className="flex p2">
            <div className="w40">
                <label htmlFor="selected-shape" className="block mb2">
                    Shape
                    <SelectTwo
                        id="selected-shape"
                        onChange={({ value }) => setSelectedShape(value)}
                        value={selectedShape}
                        className="mt0-5"
                    >
                        {shapes.map((shape) => (
                            <Option value={shape} title={shape} />
                        ))}
                    </SelectTwo>
                </label>
                <label htmlFor="selected-color">
                    Color
                    <SelectTwo
                        id="selected-color"
                        onChange={({ value }) => setSelectedColor(value)}
                        value={selectedColor}
                        className="mt0-5"
                    >
                        {colors.map((color) => (
                            <Option value={color} title={color} />
                        ))}
                    </SelectTwo>
                </label>
            </div>
            <div className={buttonContainerClassName}>{button}</div>
        </div>
    );
};

export const Compositions = () => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell>
                        <></>
                    </TableCell>
                    {colors.map((color) => (
                        <TableCell scope="col">{color}</TableCell>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {shapes.map((shape) => (
                    <TableRow>
                        <TableCell>{shape}</TableCell>
                        {colors.map((color) => (
                            <TableCell>
                                <Button shape={shape} color={color}>
                                    Loremium
                                </Button>
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const Size = () => (
    <>
        <SmallButton className="mr1">Small</SmallButton>
        <Button className="mr1">Normal</Button>
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

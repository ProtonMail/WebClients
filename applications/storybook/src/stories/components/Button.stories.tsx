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
    RadioGroup,
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

export const Basic = ({ ...args }) => <Button {...args}>Loremium</Button>;

Basic.args = {};

const shapes: Required<ButtonProps>['shape'][] = ['solid', 'outline', 'ghost'];

const colors: Required<ButtonProps>['color'][] = ['norm', 'weak', 'danger', 'warning', 'success', 'info'];

const sizes: Required<ButtonProps>['size'][] = ['small', 'medium', 'large'];

const buttonContainerClassName = 'flex flex-item-fluid flex-align-items-center flex-justify-center bordered-container';

export const Sandbox = () => {
    const [selectedShape, setSelectedShape] = useState<Required<ButtonProps>['shape']>('solid');
    const [selectedColor, setSelectedColor] = useState<Required<ButtonProps>['color']>('weak');
    const [selectedSize, setSelectedSize] = useState<Required<ButtonProps>['size']>('medium');

    const button = (
        <Button shape={selectedShape} color={selectedColor} size={selectedSize}>
            {selectedShape} {selectedColor} {selectedSize}
        </Button>
    );

    return (
        <div className="p2">
            <div className="flex flex-align-items-stretch">
                <div className="mr2">
                    <strong className="block mb1">Color</strong>
                    <RadioGroup
                        name="selected-color"
                        onChange={(v) => setSelectedColor(v)}
                        value={selectedColor}
                        options={colors.map((color) => ({ value: color, label: color }))}
                    />
                </div>
                <div className="mr2">
                    <strong className="block mb1">Shape</strong>
                    <RadioGroup
                        name="selected-shape"
                        onChange={(v) => setSelectedShape(v)}
                        value={selectedShape}
                        options={shapes.map((shape) => ({ value: shape, label: shape }))}
                    />
                </div>
                <div>
                    <strong className="block mb1">Size</strong>
                    <RadioGroup
                        name="selected-size"
                        onChange={(v) => setSelectedSize(v)}
                        value={selectedSize}
                        options={sizes.map((size) => ({ value: size, label: size }))}
                    />
                </div>
                <div className={buttonContainerClassName}>{button}</div>
            </div>
        </div>
    );
};

export const Variants = () => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell>
                        <></>
                    </TableCell>
                    {colors.map((color) => (
                        <TableCell key={color} scope="col">
                            {color}
                        </TableCell>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {shapes.map((shape) => (
                    <TableRow key={shape}>
                        <TableCell>{shape}</TableCell>
                        {colors.map((color) => (
                            <TableCell key={color}>
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

export const Legacy = () => {
    const [pokemon, setPokemon] = useState('Bulbasaur');

    return (
        <div>
            <div className="mb2">
                <Button className="mr1">Button</Button>
                <Button className="button--primaryborder mr1">Button</Button>
                <Button className="button--pill mr1">Button</Button>
                <PrimaryButton className="mr1">Button</PrimaryButton>
                <ErrorButton className="mr1">Button</ErrorButton>
                <WarningButton className="mr1">Button</WarningButton>
                <LinkButton>Button link</LinkButton>
            </div>
            <div className="mb2">
                <SmallButton className="mr1">Small</SmallButton>
                <Button className="mr1">Normal</Button>
                <LargeButton>Large</LargeButton>
            </div>
            <div className="mb2">
                <Group>
                    <ButtonGroup
                        className={pokemon === 'Bulbasaur' ? 'is-active' : ''}
                        onClick={() => setPokemon('Bulbasaur')}
                    >
                        Bulbasaur
                    </ButtonGroup>
                    <ButtonGroup
                        className={pokemon === 'Charmander' ? 'is-active' : ''}
                        onClick={() => setPokemon('Charmander')}
                    >
                        Charmander
                    </ButtonGroup>
                    <ButtonGroup
                        className={pokemon === 'Squirtle' ? 'is-active' : ''}
                        onClick={() => setPokemon('Squirtle')}
                    >
                        Squirtle
                    </ButtonGroup>
                </Group>
            </div>
            <div className="mb2">
                <Button disabled>Button</Button>
            </div>
            <div>
                <Button loading>Button</Button>
            </div>
        </div>
    );
};

import { useState } from 'react';

import { Button } from '@proton/atoms';
import { ButtonGroup, RadioGroup, Table, TableBody, TableCell, TableHeader, TableRow } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './ButtonGroup.mdx';

export default {
    component: ButtonGroup,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const BasicGroup = ({ ...args }) => {
    const [selectedButton, setSelectedButton] = useState(2);

    const buttons = [
        {
            text: 'Bulbasaur',
        },
        {
            text: 'Another',
        },
        {
            text: 'A third button',
        },
        {
            text: 'How about one more',
        },
        {
            text: 'Delete',
            color: 'danger' as const,
        },
    ];

    return (
        <ButtonGroup {...args} individualButtonColor={true}>
            {buttons.map(({ text, color }, i) => {
                return (
                    <Button key={i} selected={selectedButton === i} onClick={() => setSelectedButton(i)} color={color}>
                        {text}
                    </Button>
                );
            })}
        </ButtonGroup>
    );
};

BasicGroup.args = {};

type ButtonGroupProps = React.ComponentProps<typeof ButtonGroup>;

const shapes: Required<ButtonGroupProps>['shape'][] = ['solid', 'outline', 'ghost'];

const colors: Required<ButtonGroupProps>['color'][] = ['norm', 'weak'];

const sizes: Required<ButtonGroupProps>['size'][] = ['small', 'medium', 'large'];

const buttonContainerClassName = 'flex flex-1 items-center justify-center border';

export const Sandbox = () => {
    const [selectedShape, setSelectedShape] = useState<Required<ButtonGroupProps>['shape']>('solid');
    const [selectedColor, setSelectedColor] = useState<Required<ButtonGroupProps>['color']>('weak');
    const [selectedSize, setSelectedSize] = useState<Required<ButtonGroupProps>['size']>('medium');
    const [selectedButton, setSelectedButton] = useState(0);

    const buttons = [
        {
            text: selectedShape,
        },
        {
            text: selectedColor,
        },
        {
            text: selectedSize,
        },
    ];

    const buttonGroup = (
        <ButtonGroup shape={selectedShape} color={selectedColor} size={selectedSize}>
            {buttons.map(({ text }, i) => {
                return (
                    <Button key={i} selected={selectedButton === i} onClick={() => setSelectedButton(i)}>
                        {text}
                    </Button>
                );
            })}
        </ButtonGroup>
    );

    return (
        <div className="flex *:min-size-auto flex-column md:flex-row py-7">
            <div className="flex flex-column flex-nowrap md:flex-1">
                <div className="mr-8 mb-4">
                    <strong className="block mb-4">Color</strong>
                    <RadioGroup
                        name="selected-color"
                        onChange={(v) => setSelectedColor(v)}
                        value={selectedColor}
                        options={colors.map((color) => ({ value: color, label: color }))}
                    />
                </div>
                <div className="mr-8 mb-4">
                    <strong className="block mb-4">Shape</strong>
                    <RadioGroup
                        name="selected-shape"
                        onChange={(v) => setSelectedShape(v)}
                        value={selectedShape}
                        options={shapes.map((shape) => ({ value: shape, label: shape }))}
                    />
                </div>
                <div className="mr-8 mb-4">
                    <strong className="block mb-4">Size</strong>
                    <RadioGroup
                        name="selected-size"
                        onChange={(v) => setSelectedSize(v)}
                        value={selectedSize}
                        options={sizes.map((size) => ({ value: size, label: size }))}
                    />
                </div>
            </div>
            <div className={buttonContainerClassName}>{buttonGroup}</div>
        </div>
    );
};

export const Variants = () => {
    const [selectedButton, setSelectedButton] = useState(0);

    const buttons = [
        {
            text: 'Lorem',
        },
        {
            text: 'Ipsum',
        },
    ];

    return (
        <Table className="color-norm">
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
                                <ButtonGroup shape={shape} color={color} pill>
                                    {buttons.map(({ text }, i) => {
                                        return (
                                            <Button
                                                key={i}
                                                selected={selectedButton === i}
                                                onClick={() => setSelectedButton(i)}
                                            >
                                                {text}
                                            </Button>
                                        );
                                    })}
                                </ButtonGroup>
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

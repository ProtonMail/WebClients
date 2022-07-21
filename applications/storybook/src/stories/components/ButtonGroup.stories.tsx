import { useState } from 'react';
import {
    Button,
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TableBody,
    RadioGroup,
    ButtonGroup,
} from '@proton/components';
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

export const BasicGroup = ({ ...args }) => (
    <ButtonGroup {...args}>
        <Button>regular item</Button>
        <Button>regular item</Button>
        <Button className="is-selected">selected item</Button>
    </ButtonGroup>
);

BasicGroup.args = {};

type ButtonGroupProps = React.ComponentProps<typeof ButtonGroup>;

const shapes: Required<ButtonGroupProps>['shape'][] = ['solid', 'outline', 'ghost'];

const colors: Required<ButtonGroupProps>['color'][] = ['norm', 'weak'];

const sizes: Required<ButtonGroupProps>['size'][] = ['small', 'medium', 'large'];

const buttonContainerClassName = 'flex flex-item-fluid flex-align-items-center flex-justify-center border';

export const Sandbox = () => {
    const [selectedShape, setSelectedShape] = useState<Required<ButtonGroupProps>['shape']>('solid');
    const [selectedColor, setSelectedColor] = useState<Required<ButtonGroupProps>['color']>('weak');
    const [selectedSize, setSelectedSize] = useState<Required<ButtonGroupProps>['size']>('medium');

    const buttonGroup = (
        <ButtonGroup shape={selectedShape} color={selectedColor} size={selectedSize}>
            <Button>{selectedShape}</Button>
            <Button>{selectedColor}</Button>
            <Button>{selectedSize}</Button>
        </ButtonGroup>
    );

    return (
        <div className="my2">
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
                <div className="mr2">
                    <strong className="block mb1">Size</strong>
                    <RadioGroup
                        name="selected-size"
                        onChange={(v) => setSelectedSize(v)}
                        value={selectedSize}
                        options={sizes.map((size) => ({ value: size, label: size }))}
                    />
                </div>
                <div className={buttonContainerClassName}>{buttonGroup}</div>
            </div>
        </div>
    );
};

export const Variants = () => {
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
                                <ButtonGroup shape={shape} color={color}>
                                    <Button>Lorem</Button>
                                    <Button>ipsum</Button>
                                </ButtonGroup>
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

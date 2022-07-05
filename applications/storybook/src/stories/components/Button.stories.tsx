import { useState } from 'react';
import {
    Button,
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TableBody,
    RadioGroup,
    ButtonLike,
    Checkbox,
    Icon,
} from '@proton/components';
import { getTitle } from '../../helpers/title';

import mdx from './Button.mdx';

export default {
    component: Button,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = ({ ...args }) => <Button {...args}>Loremium</Button>;

Basic.args = {};

type ButtonProps = React.ComponentProps<typeof Button>;

const shapes: Required<ButtonProps>['shape'][] = ['solid', 'outline', 'ghost', 'underline'];

const colors: Required<ButtonProps>['color'][] = ['norm', 'weak', 'danger', 'warning', 'success', 'info'];

const sizes: Required<ButtonProps>['size'][] = ['small', 'medium', 'large'];

const toggles = ['loading', 'pill', 'fullWidth', 'icon', 'disabled'] as const;

const buttonContainerClassName = 'flex flex-item-fluid flex-align-items-center flex-justify-center border';

export const Sandbox = () => {
    const [selectedShape, setSelectedShape] = useState<Required<ButtonProps>['shape']>('solid');
    const [selectedColor, setSelectedColor] = useState<Required<ButtonProps>['color']>('weak');
    const [selectedSize, setSelectedSize] = useState<Required<ButtonProps>['size']>('medium');
    const [selectedToggles, setSelectedToggles] = useState(toggles.map(() => false));

    const button = (
        <Button
            shape={selectedShape}
            color={selectedColor}
            size={selectedSize}
            {...selectedToggles.reduce<{ [key: string]: boolean }>((acc, value, i) => {
                acc[toggles[i]] = value;
                return acc;
            }, {})}
        >
            {selectedToggles[toggles.indexOf('icon')] ? (
                <Icon name="brand-proton-mail" />
            ) : (
                <>
                    {selectedShape} {selectedColor} {selectedSize}
                </>
            )}
        </Button>
    );

    return (
        <div className="flex flex-align-items-stretch py2">
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
            <div className="mr2">
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
            <div className={buttonContainerClassName}>{button}</div>
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
                                <div className="flex flex-gap-0-5 flex-justify-center">
                                    <Button shape={shape} color={color}>
                                        Lorem
                                    </Button>
                                    {shape !== 'underline' && (
                                        <Button icon shape={shape} color={color}>
                                            <Icon name="brand-proton-mail" alt="Lorem" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const Component = (props: any) => {
    return <div {...props}>Component</div>;
};

export const Like = () => {
    return (
        <div>
            <div>
                <ButtonLike as="a" shape="outline" color="norm" href="https://protonmail.com">
                    Link
                </ButtonLike>
            </div>
            <div className="mt1">
                <ButtonLike as={Component} color="danger" className="mb1" />
            </div>
        </div>
    );
};

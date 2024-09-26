import { useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import ButtonLike from '@proton/atoms/Button/ButtonLike';
import { Checkbox, Icon, RadioGroup, Table, TableBody, TableCell, TableHeader, TableRow } from '@proton/components';

import mdx from './Button.mdx';

export default {
    component: Button,
    title: 'components/Button',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Example = () => (
    <Button color="norm" size="large">
        Loremium
    </Button>
);

export const Basic = ({ ...args }) => <Button {...args}>Loremium</Button>;

Basic.args = {};

type ButtonProps = React.ComponentProps<typeof Button>;

const shapes: Required<ButtonProps>['shape'][] = ['solid', 'outline', 'ghost', 'underline'];

const colors: Required<ButtonProps>['color'][] = ['norm', 'weak', 'danger', 'warning', 'success', 'info'];

const sizes: Required<ButtonProps>['size'][] = ['small', 'medium', 'large'];

const toggles = ['loading', 'pill', 'fullWidth', 'icon', 'disabled'] as const;

const buttonContainerClassName = 'flex md:flex-1 items-center justify-center border';

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
                <div className="mr-8 mb-4">
                    <strong className="block mb-4">Toggles</strong>
                    {toggles.map((prop, i) => {
                        return (
                            <div className="mb-2" key={i}>
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
                                <div className="flex gap-2 justify-center">
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
                <ButtonLike as="a" shape="outline" color="norm" href="https://proton.me">
                    Link
                </ButtonLike>
            </div>
            <div className="mt-4">
                <ButtonLike as={Component} color="danger" className="mb-4" />
            </div>
        </div>
    );
};

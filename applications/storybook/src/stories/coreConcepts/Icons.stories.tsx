import { useMemo, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { ButtonGroup, Mark } from '@proton/components';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import type { IconSize } from '@proton/icons/types';

const meta: Meta = {
    title: 'Core Concepts/Icons',
    parameters: {
        docs: {
            description: {
                component:
                    'Custom icon set for Proton applications. To use an icon in your code, import the matching `Ic<Name>` component from `@proton/icons/icons/<Name>`.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

type IconComponent = React.ComponentType<{ size?: IconSize }>;

const iconsContext = require.context('../../../../../packages/icons/icons', false, /\.tsx$/);

const iconComponents: Record<string, IconComponent> = Object.fromEntries(
    iconsContext.keys().map((key) => {
        const name = key.replace(/^\.\//, '').replace(/\.tsx$/, '');
        return [name, iconsContext(key)[name] as IconComponent];
    })
);

const iconNames = Object.keys(iconComponents).sort();

const sizes: IconSize[] = [4, 5, 7, 10, 15];

const IconsGallery = () => {
    const [selectedSize, setSelectedSize] = useState<IconSize>(10);
    const [search, setSearch] = useState('');

    const iconResults = useMemo(() => {
        if (search.length <= 1) {
            return iconNames;
        }
        return iconNames.filter((x) => x.toLowerCase().includes(search.toLowerCase()));
    }, [search]);

    return (
        <>
            <div className="flex flex-nowrap gap-4">
                <Input
                    prefix={<IcMagnifier />}
                    placeholder={`Search ${iconNames.length} icons by name…`}
                    value={search}
                    onChange={({ target: { value } }) => setSearch(value)}
                    className="flex-1"
                />
                <ButtonGroup>
                    {sizes.map((size) => (
                        <Button
                            onClick={() => setSelectedSize(size)}
                            selected={size === selectedSize}
                            title={`Set icon size to ${size}`}
                        >
                            {size}
                        </Button>
                    ))}
                </ButtonGroup>
            </div>
            <div className="icon-grid mt-8">
                {iconResults.map((componentName) => {
                    const IconComponent = iconComponents[componentName];
                    return (
                        <div className="border rounded text-center p-4" key={componentName}>
                            <IconComponent size={selectedSize} />
                            <div className="mt-4 text-monospace lh120 user-select">
                                <Mark value={search}>{componentName}</Mark>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export const Default: Story = {
    render: () => <IconsGallery />,
};

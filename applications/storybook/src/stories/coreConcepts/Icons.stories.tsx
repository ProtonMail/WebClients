import { useMemo, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { ButtonGroup, Icon, Mark } from '@proton/components';
import iconSvg from '@proton/icons/assets/sprite-icons.svg';
import type { IconName } from '@proton/icons/types';

const meta: Meta = {
    title: 'Core Concepts/Icons',
    parameters: {
        docs: {
            description: {
                component:
                    'Custom icon set for Proton applications. To use an icon in your code, refer to the Icon component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

type IconProps = React.ComponentProps<typeof Icon>;

const sizes: Required<IconProps>['size'][] = [4, 5, 7, 10, 15];

export const Default: Story = {
    render: () => {
        const [selectedSize, setSelectedSize] = useState<Required<IconProps>['size']>(10);
        const primaryIconNames: IconName[] = iconSvg
            .match(/id="ic-([^"]+)/g)
            .map((x: string) => x.replace('id="ic-', ''));
        const [search, setSearch] = useState('');

        const iconResults = useMemo(() => {
            if (search.length <= 1) {
                return primaryIconNames;
            }
            return primaryIconNames.filter((x) => x.toLowerCase().includes(search.toLocaleLowerCase()));
        }, [search]);

        return (
            <>
                <div className="flex flex-nowrap gap-4">
                    <Input
                        prefix={<Icon name="magnifier" />}
                        placeholder={`Search ${primaryIconNames.length} icons by name…`}
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
                    {iconResults.map((iconName) => (
                        <div className="border rounded text-center p-4" key={iconName}>
                            <Icon name={iconName} size={selectedSize} />
                            <div className="mt-4 text-monospace lh120 user-select">
                                <Mark value={search}>{iconName}</Mark>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    },
};

import { useState, useMemo } from 'react';
import { Button, ButtonGroup, Icon, IconName, InputTwo, Mark } from '@proton/components';
import iconSvg from '@proton/styles/assets/img/icons/sprite-icons.svg';

import { getTitle } from '../../helpers/title';
import mdx from './Icons.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

type IconProps = React.ComponentProps<typeof Icon>;

const sizes: Required<IconProps>['size'][] = [16, 20, 28, 40, 60];

export const PrimaryIcons = () => {
    const [selectedSize, setSelectedSize] = useState<Required<IconProps>['size']>(40);
    const primaryIconNames: IconName[] = iconSvg.match(/id="ic-([^"]+)/g).map((x: string) => x.replace('id="ic-', ''));
    const [search, setSearch] = useState('');

    const iconResults = useMemo(() => {
        if (search.length <= 1) {
            return primaryIconNames;
        }
        return primaryIconNames.filter((x) => x.toLowerCase().includes(search.toLocaleLowerCase()));
    }, [search]);

    return (
        <>
            <div className="flex flex-nowrap flex-gap-1">
                <InputTwo
                    prefix={<Icon name="magnifier" />}
                    placeholder={`Search ${primaryIconNames.length} icons by name…`}
                    value={search}
                    onChange={({ target: { value } }) => setSearch(value)}
                    className="flex-item-fluid"
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
            <div className="icon-grid mt2">
                {iconResults.map((iconName) => (
                    <div className="border rounded text-center p1" key={iconName}>
                        <Icon name={iconName} size={selectedSize} />
                        <div className="mt1 text-monospace lh120 user-select">
                            <Mark value={search}>{iconName}</Mark>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

import type { IconProps } from '@proton/components';
import { Icon } from '@proton/components';

import mdx from './Icon.mdx';

export default {
    component: Icon,
    title: 'Components/Icon',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = ({ ...args }: IconProps) => <Icon {...args} />;

Basic.args = {
    name: 'brand-proton-mail',
};

export const Color = () => {
    const colors = ['primary', 'danger', 'success', 'warning', 'info'];

    const sizes = [3, 4, 6, 10, 12] as const;

    return (
        <div>
            <div className="flex items-end justify-center">
                {sizes.map((size) => (
                    <Icon name="brand-proton-mail" size={size} className="mr-4" />
                ))}
            </div>
            {colors.map((color) => (
                <div className="flex items-end justify-center">
                    {sizes.map((size) => (
                        <Icon name="brand-proton-mail" size={size} className={`color-${color} mr-4`} />
                    ))}
                </div>
            ))}
        </div>
    );
};

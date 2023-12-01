import { Icon, IconProps } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Icon.mdx';

export default {
    component: Icon,
    title: getTitle(__filename, false),
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

    const sizes = [12, 16, 24, 40, 48] as const;

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

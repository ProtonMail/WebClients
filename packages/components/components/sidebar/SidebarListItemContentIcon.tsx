import clsx from '@proton/utils/clsx';

import Icon, { IconProps } from '../icon/Icon';

const SidebarListItemContentIcon = ({ className, ...rest }: IconProps) => {
    return (
        <Icon className={clsx(['navigation-icon shrink-0 flex-item-centered-vert', className])} {...rest} />
    );
};

export default SidebarListItemContentIcon;

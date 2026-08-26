import clsx from '@proton/utils/clsx';

import Icon from '../icon/Icon';
import type { IconProps } from '../icon/Icon';

export const navigationIconClassName = 'navigation-icon shrink-0 self-center my-auto';

const SidebarListItemContentIcon = ({ className, ...rest }: IconProps) => {
    return <Icon className={clsx([navigationIconClassName, className])} {...rest} />;
};

export default SidebarListItemContentIcon;

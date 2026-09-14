import type { IconComponent, IconComponentProps } from '@proton/icons/component';
import clsx from '@proton/utils/clsx';

export const navigationIconClassName = 'navigation-icon shrink-0 self-center my-auto';

interface Props extends IconComponentProps {
    icon: IconComponent;
}

const SidebarListItemContentIcon = ({ icon: Icon, className, ...rest }: Props) => {
    return <Icon className={clsx([navigationIconClassName, className])} {...rest} />;
};

export default SidebarListItemContentIcon;

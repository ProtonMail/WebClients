import type { IconComponent, IconComponentProps } from '@proton/icons/component';
import clsx from '@proton/utils/clsx';

export const navigationIconClassName = 'navigation-icon shrink-0 self-center my-auto';

interface Props extends IconComponentProps {
    icon: IconComponent;
}

// Inline style, as an svg `color` attribute loses to `.navigation-icon`'s color
const SidebarListItemContentIcon = ({ icon: Icon, className, color, style, ...rest }: Props) => {
    return (
        <Icon
            className={clsx([navigationIconClassName, className])}
            style={color ? { ...style, color } : style}
            {...rest}
        />
    );
};

export default SidebarListItemContentIcon;

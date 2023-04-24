import { classnames } from '../../helpers';
import Icon, { IconProps } from '../icon/Icon';

const SidebarListItemContentIcon = ({ className, ...rest }: IconProps) => {
    return (
        <Icon
            className={classnames(['navigation-icon flex-item-noshrink mr-2 flex-item-centered-vert', className])}
            {...rest}
        />
    );
};

export default SidebarListItemContentIcon;

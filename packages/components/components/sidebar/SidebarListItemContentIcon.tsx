import Icon, { Props } from '../icon/Icon';
import { classnames } from '../../helpers';

const SidebarListItemContentIcon = ({ className, ...rest }: Props) => {
    return (
        <Icon
            className={classnames(['navigation-icon flex-item-noshrink mr0-5 flex-item-centered-vert', className])}
            {...rest}
        />
    );
};

export default SidebarListItemContentIcon;

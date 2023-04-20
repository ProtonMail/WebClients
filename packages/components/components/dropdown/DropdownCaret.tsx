import { classnames } from '../../helpers';
import Icon, { IconName, IconSize } from '../icon/Icon';

interface Props {
    className?: string;
    isOpen?: boolean;
    size?: IconSize;
    iconName?: IconName;
}
const DropdownCaret = ({ className, isOpen, size = 16, iconName = 'chevron-down-filled' }: Props) => {
    return <Icon className={classnames([isOpen && 'rotateX-180', className])} size={size} name={iconName} />;
};

export default DropdownCaret;

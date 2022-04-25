import { classnames } from '../../helpers';
import Icon, { IconSize } from '../icon/Icon';

interface Props {
    className?: string;
    isOpen?: boolean;
    size?: IconSize;
}
const DropdownCaret = ({ className, isOpen, size = 16 }: Props) => {
    return <Icon className={classnames([isOpen && 'rotateX-180', className])} size={size} name="chevron-down-filled" />;
};

export default DropdownCaret;

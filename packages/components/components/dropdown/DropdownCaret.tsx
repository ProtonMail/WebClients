import { classnames } from '../../helpers';
import Icon from '../icon/Icon';

interface Props {
    className?: string;
    isOpen?: boolean;
}
const DropdownCaret = ({ className, isOpen }: Props) => {
    return <Icon className={classnames([isOpen && 'rotateX-180', className])} size={12} name="caret" />;
};

export default DropdownCaret;

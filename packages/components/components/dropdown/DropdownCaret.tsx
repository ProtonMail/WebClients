import Icon from '@proton/components/components/icon/Icon';
import type { IconName, IconSize } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    isOpen?: boolean;
    size?: IconSize;
    iconName?: IconName;
}
const DropdownCaret = ({ className, isOpen, size = 4, iconName = 'chevron-down-filled' }: Props) => {
    return <Icon className={clsx([isOpen && 'rotateX-180', className])} size={size} name={iconName} />;
};

export default DropdownCaret;

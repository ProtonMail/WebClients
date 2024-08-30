import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

type IconColor = 'danger' | 'warning' | 'info' | 'success';

interface Props {
    icon: IconName;
    color?: IconColor;
    className?: string;
}

const SecurityCheckupMainIcon = ({ icon, color = 'info', className }: Props) => {
    return (
        <div className={clsx('p-2 shrink-0 rounded overflow-hidden', `security-checkup-color--${color}`, className)}>
            <Icon name={icon} size={6} />
        </div>
    );
};

export default SecurityCheckupMainIcon;

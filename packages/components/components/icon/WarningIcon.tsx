import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

import Icon from './Icon';

interface Props {
    warning: string;
    className?: string;
}

const WarningIcon = ({ warning, className }: Props) => {
    if (!warning.length) {
        return null;
    }

    const icon = <Icon name="exclamation-circle" className={clsx([className, 'color-warning'])} />;
    return <Tooltip title={warning}>{icon}</Tooltip>;
};

export default WarningIcon;

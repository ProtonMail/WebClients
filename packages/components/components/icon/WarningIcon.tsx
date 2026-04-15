import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import clsx from '@proton/utils/clsx';

interface Props {
    warning: string;
    className?: string;
}

const WarningIcon = ({ warning, className }: Props) => {
    if (!warning.length) {
        return null;
    }

    const icon = <IcExclamationCircle className={clsx([className, 'color-warning'])} />;
    return <Tooltip title={warning}>{icon}</Tooltip>;
};

export default WarningIcon;

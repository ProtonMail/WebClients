import { Tooltip } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

interface Props {
    text: string;
    tooltipText: string;
    selected?: boolean;
}

const ProtonBadge = ({ text, tooltipText, selected = false }: Props) => {
    return (
        <Tooltip title={tooltipText}>
            <span className={clsx('label-stack-item-inner text-ellipsis cursor-pointer', selected && '')}>
                <span className="label-stack-item-text color-primary">{text}</span>
            </span>
        </Tooltip>
    );
};

export default ProtonBadge;

import { Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './ProtonBadge.scss';

interface Props {
    text: string;
    tooltipText: string;
    className?: string;
    selected?: boolean;
}

const ProtonBadge = ({ text, tooltipText, className, selected = false }: Props) => {
    return (
        <Tooltip title={tooltipText}>
            <span
                className={clsx(
                    'label-proton-badge inline-flex rounded-sm bg-weak shrink-0 text-ellipsis text-semibold text-sm ml-2 mr-1',
                    selected && 'label-proton-badge--selected',
                    className
                )}
                data-testid="proton-badge"
            >
                <span className="label-proton-badge-text m-auto">{text}</span>
            </span>
        </Tooltip>
    );
};

export default ProtonBadge;

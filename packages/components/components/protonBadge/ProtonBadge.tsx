import { Tooltip } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import './ProtonBadge.scss';

interface Props {
    text: string;
    tooltipText: string;
    selected?: boolean;
}

const ProtonBadge = ({ text, tooltipText, selected = false }: Props) => {
    return (
        <Tooltip title={tooltipText}>
            <span
                className={clsx(
                    'label-proton-badge inline-flex rounded bg-weak flex-item-noshrink text-ellipsis text-semibold ml-2 text-sm mr-1',
                    selected && 'label-proton-badge--selected'
                )}
                data-testid="proton-badge"
            >
                <span className="label-proton-badge-text color-primary mauto">{text}</span>
            </span>
        </Tooltip>
    );
};

export default ProtonBadge;

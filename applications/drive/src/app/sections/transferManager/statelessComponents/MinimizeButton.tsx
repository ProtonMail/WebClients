import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

type Props = {
    onClick: () => void;
    isMinimized: boolean;
};

export const MinimizeButton = ({ onClick, isMinimized }: Props) => {
    const minMaxTitle = isMinimized ? c('Action').t`Maximize transfers` : c('Action').t`Minimize transfers`;

    return (
        <Tooltip title={minMaxTitle}>
            <Button
                icon
                type="button"
                size="medium"
                shape="ghost"
                onClick={onClick}
                aria-expanded={!isMinimized}
                data-testid="drive-transfers-manager:minimize"
                aria-controls="transfer-manager"
            >
                <Icon className={clsx(['icon-size-4.5', isMinimized && 'rotateX-180'])} name="chevron-down" />
                <span className="sr-only">{minMaxTitle}</span>
            </Button>
        </Tooltip>
    );
};

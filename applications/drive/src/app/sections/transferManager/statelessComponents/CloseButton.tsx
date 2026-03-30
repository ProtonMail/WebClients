import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';

type Props = {
    onClick: () => void;
};

export const CloseButton = ({ onClick }: Props) => {
    const closeTitle = c('Action').t`Close transfers`;

    return (
        <Tooltip title={closeTitle}>
            <Button
                icon
                type="button"
                size="medium"
                shape="ghost"
                data-testid="drive-transfers-manager:close"
                onClick={onClick}
            >
                <Icon size={4.5} name="cross" alt={closeTitle} />
            </Button>
        </Tooltip>
    );
};

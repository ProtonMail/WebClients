import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcCross } from '@proton/icons/icons/IcCross';

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
                <IcCross size={4.5} alt={closeTitle} />
            </Button>
        </Tooltip>
    );
};

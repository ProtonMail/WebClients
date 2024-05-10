import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';

interface Props {
    onClose: () => void;
}

const PopoverCloseButton = ({ onClose }: Props) => {
    return (
        <Tooltip title={c('Event popover close button').t`Close popover`}>
            <Button icon shape="ghost" size="small" className="color-weak" onClick={onClose}>
                <Icon name="cross-big" alt={c('Action').t`Close event popover`} />
            </Button>
        </Tooltip>
    );
};

export default PopoverCloseButton;

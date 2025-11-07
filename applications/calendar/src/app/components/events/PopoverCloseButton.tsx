import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';

interface Props {
    onClose: () => void;
}

const PopoverCloseButton = ({ onClose }: Props) => {
    return (
        <Tooltip title={c('Event popover close button').t`Close popover`}>
            <Button icon shape="ghost" size="small" className="color-weak" onClick={onClose}>
                <IcCrossBig alt={c('Action').t`Close event popover`} />
            </Button>
        </Tooltip>
    );
};

export default PopoverCloseButton;

import { c } from 'ttag';
import { Button, Icon, Tooltip } from '@proton/components';

interface Props {
    onClose: () => void;
}

const PopoverCloseButton = ({ onClose }: Props) => {
    return (
        <Tooltip title={c('Event popover close button').t`Close popover`}>
            <Button icon shape="ghost" size="small" onClick={onClose}>
                <Icon name="xmark" alt={c('Action').t`Close event popover`} />
            </Button>
        </Tooltip>
    );
};

export default PopoverCloseButton;

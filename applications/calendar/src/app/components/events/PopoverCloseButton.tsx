import { c } from 'ttag';
import { Button, Icon } from '@proton/components';

interface Props {
    onClose: () => void;
}

const PopoverCloseButton = ({ onClose }: Props) => {
    return (
        <Button
            icon
            shape="ghost"
            size="small"
            className="modal-close"
            title={c('Action').t`Close popover`}
            onClick={onClose}
        >
            <Icon name="close" alt={c('Action').t`Close popover`} />
        </Button>
    );
};

export default PopoverCloseButton;

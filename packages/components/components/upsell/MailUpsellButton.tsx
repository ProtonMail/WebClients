import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';

interface Props {
    onClick: () => void;
    text: string;
}

const MailUpsellButton = ({ onClick, text }: Props) => {
    return (
        <Button
            shape="outline"
            onClick={onClick}
            className="mb-2 md:mb-0 inline-flex flex-nowrap flex-align-items-baseline"
        >
            <Icon name="brand-proton-mail-filled" className="flex-item-noshrink my-auto" />
            <span className="flex-item-noshrink mr-2" aria-hidden="true">
                +
            </span>
            {text}
        </Button>
    );
};

export default MailUpsellButton;

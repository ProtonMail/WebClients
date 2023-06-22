import { PromotionButton } from '../button/PromotionButton';

interface Props {
    onClick: () => void;
    text: string;
}

const MailUpsellButton = ({ onClick, text }: Props) => {
    return (
        <PromotionButton iconName="brand-proton-mail-filled-plus" onClick={onClick}>
            {text}
        </PromotionButton>
    );
};

export default MailUpsellButton;

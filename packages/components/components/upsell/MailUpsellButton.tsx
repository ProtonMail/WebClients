import { IcBrandProtonMailFilledPlus } from '@proton/icons/icons/IcBrandProtonMailFilledPlus';

import { PromotionButton } from '../button/PromotionButton';

interface Props {
    onClick: () => void;
    text: string;
}

const MailUpsellButton = ({ onClick, text }: Props) => {
    return (
        <PromotionButton iconComponent={IcBrandProtonMailFilledPlus} onClick={onClick}>
            {text}
        </PromotionButton>
    );
};

export default MailUpsellButton;

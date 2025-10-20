import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface FooterProps {
    onClick: () => void;
    onNeverShow: () => void;
}

export const UnlimitedToDuoOfferFooter = ({ onClick, onNeverShow }: FooterProps) => {
    return (
        <div className="flex flex-column">
            <Button color="norm" className="mb-4" onClick={onClick}>{c('Offer').t`Get ${BRAND_NAME} Duo`}</Button>
            <Button color="weak" shape="underline" onClick={onNeverShow}>{c('Offer').t`Don't show this again`}</Button>
        </div>
    );
};

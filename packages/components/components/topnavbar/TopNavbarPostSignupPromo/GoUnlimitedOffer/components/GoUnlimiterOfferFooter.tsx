import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    onClick: () => void;
    onNeverShow: () => void;
}

export const GoUnlimitedOfferFooter = ({ onClick, onNeverShow }: Props) => {
    return (
        <div className="text-center mb-4">
            <Button color="norm" className="mb-4" onClick={onClick} fullWidth>{c('Offer')
                .t`Get ${BRAND_NAME} Unlimited`}</Button>
            <div className="text-center">
                <Button className="color-weak" shape="underline" onClick={onNeverShow}>{c('Offer')
                    .t`Don’t show this again`}</Button>
            </div>
        </div>
    );
};

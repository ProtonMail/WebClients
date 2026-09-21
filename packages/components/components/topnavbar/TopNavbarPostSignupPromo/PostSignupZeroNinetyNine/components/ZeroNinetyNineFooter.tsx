import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PLANS } from '@proton/payments/core/constants';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import { getNormalizedPlanTitleToPlus } from '../../../../../containers/payments/subscription/plusToPlusHelper';

interface Props {
    onUpsellClick: () => void;
    onNeverShow: () => void;
}

export const ZeroNinetyNineFooter = ({ onUpsellClick, onNeverShow }: Props) => {
    const planName = getNormalizedPlanTitleToPlus(PLANS.MAIL);

    return (
        <>
            <div className="text-center mb-4">
                <Button color="norm" onClick={onUpsellClick} fullWidth>
                    {getPlanOrAppNameText(planName)}
                </Button>
            </div>
            <div className="text-center">
                <Button onClick={onNeverShow} shape="underline" color="norm" className="p-0">
                    {c('Offer').t`Don’t show this offer again`}
                </Button>
            </div>
        </>
    );
};

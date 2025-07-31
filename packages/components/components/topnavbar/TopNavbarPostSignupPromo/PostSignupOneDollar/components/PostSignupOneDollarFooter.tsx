import { Button } from '@proton/atoms';
import { getNormalizedPlanTitleToPlus } from '@proton/components/containers/payments/subscription/plusToPlusHelper';
import { PLANS } from '@proton/payments';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import clsx from '@proton/utils/clsx';

import type { SUPPORTED_PRODUCTS } from '../interface';

interface Props {
    product: SUPPORTED_PRODUCTS;
    onClick: () => void;
    extended?: boolean;
}

export const PostSignupOneDollarFooter = ({ product, onClick, extended }: Props) => {
    const planName = getNormalizedPlanTitleToPlus(product === 'mail' ? PLANS.MAIL : PLANS.DRIVE);

    return (
        <div className={clsx('text-center', extended ? 'mb-2' : 'mb-4')}>
            <Button color="norm" onClick={onClick} fullWidth>
                {getPlanOrAppNameText(planName)}
            </Button>
        </div>
    );
};

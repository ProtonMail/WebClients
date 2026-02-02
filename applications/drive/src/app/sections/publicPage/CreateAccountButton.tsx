import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Icon from '@proton/components/components/icon/Icon';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments';
import { DRIVE_PRICING_PAGE, DRIVE_SIGNUP } from '@proton/shared/lib/drive/urls';
import useFlag from '@proton/unleash/useFlag';

import { useDriveFreePromo } from '../../hooks/payments/useDriveFreePromo';

export const CreateAccountButton = () => {
    const UPSELL_REF = 'sharepage_upsell';
    const UPSELL_LINK = `${DRIVE_SIGNUP}?plan=${PLANS.DRIVE}&billing=${CYCLE.MONTHLY}&coupon=${COUPON_CODES.TRYDRIVEPLUS2024}&ref=${UPSELL_REF}`;
    const { promoData, hasError } = useDriveFreePromo({ codes: [COUPON_CODES.TRYDRIVEPLUS2024] });
    const hasPriceData = promoData?.Currency && promoData?.AmountDue;
    const simplePriceString = hasPriceData ? getSimplePriceString(promoData.Currency, promoData.AmountDue) : '';
    const isUpsellingEnabled = useFlag('DriveWebSharePageUpsell');

    return isUpsellingEnabled && hasPriceData && !hasError ? (
        <ButtonLike
            className="w-full md:w-auto inline-flex items-center"
            color="norm"
            shape="ghost"
            as="a"
            href={UPSELL_LINK}
            target="_blank"
        >
            <Icon className="mr-2" name="light-lightbulb" />
            {hasPriceData && c('Action').t`Get secure storage for ${simplePriceString}`}
        </ButtonLike>
    ) : (
        <ButtonLike
            className="w-full md:w-auto"
            color="norm"
            shape="solid"
            as="a"
            href={DRIVE_PRICING_PAGE}
            target="_blank"
        >
            {c('Action').t`Create free account`}
        </ButtonLike>
    );
};

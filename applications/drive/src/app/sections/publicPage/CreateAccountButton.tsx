import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { useCurrencies } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { IcLightLightbulb } from '@proton/icons/icons/IcLightLightbulb';
import { COUPON_CODES, CYCLE, PLANS, type SubscriptionEstimation } from '@proton/payments';
import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import { DRIVE_PRICING_PAGE, DRIVE_SIGNUP } from '@proton/shared/lib/drive/urls';
import { useFlag } from '@proton/unleash/useFlag';

interface UseDriveFreePromoProps {
    codes: string[] | undefined;
}

function useDriveFreePromo({ codes }: UseDriveFreePromoProps) {
    const { getPreferredCurrency } = useCurrencies();
    const { paymentsApi } = usePaymentsApi();
    const [plansResult] = usePlans();
    const [paymentStatus] = usePaymentStatus();

    const [result, setResult] = useState<SubscriptionEstimation | null>(null);
    const [hasError, setHasError] = useState(false);
    const codesKey = codes?.join(',') ?? '';
    const currency = getPreferredCurrency({
        paymentStatus,
        plans: plansResult?.plans,
        paramPlanName: PLANS.DRIVE,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (currency) {
                setHasError(false);
                const subscriptionData: CheckSubscriptionData = {
                    Plans: { [PLANS.DRIVE]: 1 },
                    Currency: currency,
                    Cycle: CYCLE.MONTHLY,
                    Codes: codesKey.split(','),
                };
                try {
                    const res = await paymentsApi.checkSubscription(subscriptionData);
                    setResult(res);
                } catch (error) {
                    setHasError(true);
                    throw error;
                }
            }
        };

        void fetchData();
        // paymentsApi is not stable
        // TODO: update the usePaymentsApi with useCallback
    }, [currency, codesKey]);

    return { promoData: result, hasError };
}

interface CreateAccountButtonProps {
    isMobile?: boolean;
}

export const CreateAccountButton = ({ isMobile = false }: CreateAccountButtonProps) => {
    const UPSELL_REF = 'sharepage_upsell';
    const UPSELL_LINK = `${DRIVE_SIGNUP}?plan=${PLANS.DRIVE}&billing=${CYCLE.MONTHLY}&coupon=${COUPON_CODES.TRYDRIVEPLUS2024}&ref=${UPSELL_REF}`;
    const { promoData, hasError } = useDriveFreePromo({ codes: [COUPON_CODES.TRYDRIVEPLUS2024] });
    const hasPriceData = promoData?.Currency && promoData?.AmountDue;
    const simplePriceString = hasPriceData ? getSimplePriceString(promoData.Currency, promoData.AmountDue) : '';
    const isUpsellingEnabled = useFlag('DriveWebSharePageUpsell');

    return isUpsellingEnabled && hasPriceData && !hasError && !isMobile ? (
        <ButtonLike
            className="w-full md:w-auto inline-flex items-center"
            color="norm"
            shape="ghost"
            as="a"
            href={UPSELL_LINK}
            target="_blank"
        >
            <IcLightLightbulb className="mr-2" />
            {hasPriceData && c('Action').t`Get secure storage for ${simplePriceString}`}
        </ButtonLike>
    ) : (
        <ButtonLike className="w-auto" color="norm" shape="solid" as="a" href={DRIVE_PRICING_PAGE} target="_blank">
            {c('Action').t`Sign up`}
        </ButtonLike>
    );
};

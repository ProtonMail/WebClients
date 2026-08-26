import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PaymentMethodType } from '@proton/payments/core/interface';
import { IDEAL_WERO_BRAND_NAME } from '@proton/shared/lib/constants';

const getCurrencyOverrideBannerText = (selectedMethod: PaymentMethodType | undefined) => {
    if (selectedMethod === PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL) {
        return c('Payments')
            .t`Your currency has been changed to euros (€) because ${IDEAL_WERO_BRAND_NAME} only supports payments in euros.`;
    } else if (selectedMethod === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT) {
        return c('Payments')
            .t`Your currency has been changed to euros (€) because SEPA bank transfers only support payments in euros.`;
    }

    return null;
};

interface CurrencyOverrideBannerTextProps {
    selectedMethod: PaymentMethodType | undefined;
}

export const CurrencyOverrideBannerText = ({ selectedMethod }: CurrencyOverrideBannerTextProps) => {
    const currencyOverrideBannerText = getCurrencyOverrideBannerText(selectedMethod);

    if (!currencyOverrideBannerText) {
        return null;
    }

    return (
        <Banner className="mt-2 mb-4" variant={BannerVariants.INFO}>
            {currencyOverrideBannerText}
        </Banner>
    );
};

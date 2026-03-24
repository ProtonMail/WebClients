import { c } from 'ttag';

import { CircledNumber } from '@proton/atoms/CircledNumber/CircledNumber';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getMinDonationAmount } from '@proton/payments/core/amount-limits';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { getDonationCurrency } from '../helpers/emailReservationHelpers';

const HowItWorks = () => {
    const isBornPrivateEuropeEnabled = useFlag('BornPrivateEurope');
    const { paymentStatus } = usePayments();
    const currency = isBornPrivateEuropeEnabled ? getDonationCurrency(paymentStatus?.CountryCode) : 'USD';
    const minimumDonation = getSimplePriceString(currency, getMinDonationAmount(currency));

    const getSteps = () => [
        c('Label').t`Choose an address to reserve for your child`,
        c('Label').t`Enter your email address`,
        c('Label').t`Donate ${minimumDonation} or more to the ${BRAND_NAME} Foundation`,
    ];

    return (
        <div className="pb-1">
            <p className="text-semibold my-0">{c('Info').t`How it works`}</p>
            <ol className="unstyled flex flex-column flex-nowrap gap-4 mt-3 mb-3">
                {getSteps().map((step, index) => (
                    <li key={index} className="flex flex-row items-top flex-nowrap gap-2">
                        <CircledNumber number={index + 1} textSizeClassName="text-sm" aria-hidden="true" />
                        <span className="color-weak flex-1">{step}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default HowItWorks;

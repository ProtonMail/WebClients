import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import CurrencySelector from '@proton/components/containers/payments/CurrencySelector';
import type { Currency } from '@proton/payments/core/interface';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';

import SubscriptionCheckoutPlanDetails from './plan-section/SubscriptionCheckoutPlanDetails';
import SubscriptionCheckoutPlanMoreInformation from './plan-section/SubscriptionCheckoutPlanMoreInformation';

interface Props {
    onChangePlan: () => void;
    shouldDisableCurrencySelection: boolean;
    availableCurrencies: readonly Currency[];
    hasSavedPaymentMethods: boolean;
}

const SubscriptionCheckoutPlanSection = ({
    onChangePlan,
    shouldDisableCurrencySelection,
    availableCurrencies,
    hasSavedPaymentMethods,
}: Props) => {
    const { checkoutUi, selectCurrency } = usePayments();
    const { currency } = checkoutUi;

    return (
        <>
            <div className="flex align-middle items-center justify-between w-full my-4">
                <div className="flex align-middle items-center flex-1 gap-3 ">
                    <h2 className="text-2xl text-bold">{c('Label').t`Your plan`}</h2>
                    <InlineLinkButton onClick={onChangePlan}>{c('Action').t`Change`}</InlineLinkButton>
                </div>
                <div className="shrink-0">
                    <CurrencySelector
                        currencies={availableCurrencies}
                        currency={currency}
                        onSelect={selectCurrency}
                        mode="select-two"
                        disabled={shouldDisableCurrencySelection}
                        className="h-full ml-auto px-3 color-primary relative interactive-pseudo interactive--no-background border-none"
                    />
                </div>
            </div>
            <SubscriptionCheckoutPlanDetails hasSavedPaymentMethods={hasSavedPaymentMethods} />
            <SubscriptionCheckoutPlanMoreInformation />
        </>
    );
};

export default SubscriptionCheckoutPlanSection;

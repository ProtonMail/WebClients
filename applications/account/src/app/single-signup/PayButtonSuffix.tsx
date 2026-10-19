import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Alert3ds from '@proton/components/containers/payments/Alert3ds';
import { getCheckoutRenewNoticeTextFromCheckResult } from '@proton/payments-ui/ui/components/RenewalNotice';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PlainPaymentMethodType, PlanIDs } from '@proton/payments/core/interface';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';

import { getLocaleTermsURL } from '../content/helper';
import Guarantee from './Guarantee';

interface Props {
    paymentMethodType: PlainPaymentMethodType | undefined;
    hasGuarantee: boolean;
    hasSelectedFree: boolean;
    checkTrial: boolean;
    checkResult: SubscriptionEstimation;
    plansMap: PlansMap;
    planIDs: PlanIDs;
}

const PayButtonSuffix = ({
    paymentMethodType,
    hasGuarantee,
    hasSelectedFree,
    checkTrial,
    checkResult,
    plansMap,
    planIDs,
}: Props) => {
    const termsAndConditions = (
        <Href className="color-norm" key="terms" href={getLocaleTermsURL(APPS.PROTONVPN_SETTINGS)}>
            {
                // translator: Full sentence "By clicking on "Pay", you agree to our terms and conditions."
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    return (
        <>
            {hasGuarantee && (
                <div className="text-center color-success my-4">
                    <Guarantee />
                </div>
            )}
            {!hasSelectedFree && (
                <div className="w-full text-sm color-norm text-center">
                    <div className="mx-auto w-full">
                        *
                        {getCheckoutRenewNoticeTextFromCheckResult({
                            checkResult,
                            plansMap,
                            planIDs,
                            app: APPS.PROTONVPN_SETTINGS,
                        })}
                    </div>
                </div>
            )}
            {paymentMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && <Alert3ds />}
            <div className="mt-4 text-sm text-center">
                {checkTrial
                    ? // translator: Full sentence "By clicking on "Try", you agree to our terms and conditions."
                      c('b2b_trials_2025_Info').jt`By clicking on "Try", you agree to our ${termsAndConditions}.`
                    : // translator: Full sentence "By clicking on "Pay", you agree to our terms and conditions."
                      c('new_plans: signup').jt`By clicking on "Pay", you agree to our ${termsAndConditions}.`}
            </div>
        </>
    );
};

export default PayButtonSuffix;

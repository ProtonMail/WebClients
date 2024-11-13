import { c } from 'ttag';

import { Pill } from '@proton/atoms';
import type { ModalOwnProps, OpenSubscriptionModalCallback } from '@proton/components';
import { SUBSCRIPTION_STEPS } from '@proton/components';
import { PLANS } from '@proton/payments/core/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { Button, Modal } from '../../../atoms';
import type { QuoteWithProvider } from './index';

import './AztecoPaymentDetailsModal.scss';

interface Props extends ModalOwnProps {
    selectedQuote: QuoteWithProvider;
    amountToPay: number;
    btcAmountToReceive: number;
    hasWalletPaidPlans: boolean;
    user: UserModel;
    openSubscriptionModal: OpenSubscriptionModalCallback;
}

const percentageServiceFeeFreeUser = 4;
const percentageServiceFeePaidUser = 3;

export const AztecoPaymentDetailsModal = ({
    selectedQuote,
    amountToPay,
    btcAmountToReceive,
    hasWalletPaidPlans,
    user,
    openSubscriptionModal,
    ...modalProps
}: Props) => {
    const serviceFeePercentage = hasWalletPaidPlans ? percentageServiceFeePaidUser : percentageServiceFeeFreeUser;
    const amountMinusPaymentProcessingFee =
        Number(selectedQuote.FiatAmount) - Number(selectedQuote.PaymentProcessingFee);
    const serviceFeeFreeUser = (amountMinusPaymentProcessingFee * percentageServiceFeeFreeUser) / 100;
    const serviceFeePaidUser = (amountMinusPaymentProcessingFee * percentageServiceFeePaidUser) / 100;
    const serviceFeeAmount = (serviceFeeFreeUser - serviceFeePaidUser).toFixed(2);

    return (
        <Modal open title={c('bitcoin buy').t`Payment details`} className={'modal-two-dialog-wallet'} {...modalProps}>
            <div className="flex flex-column gap-4">
                <div className="text-sm text-weak mb-2 text-center">
                    {c('bitcoin buy').t`This quote is valid for the next 5 minutes`}
                </div>

                <div className="flex flex-column gap-2">
                    <div className="flex flex-row justify-space-between text-bold">
                        <div>{c('bitcoin buy').t`You pay`}</div>
                        {selectedQuote.FiatAmount} {selectedQuote.FiatCurrencySymbol}
                    </div>

                    <hr />

                    <div className="flex flex-row justify-space-between">
                        <div>
                            {
                                // translator: 4% service fee
                                c('bitcoin buy').t`${serviceFeePercentage}% service fee`
                            }
                        </div>
                        <div>
                            {hasWalletPaidPlans && (
                                <Pill backgroundColor="#EBE7FF" className="mr-1">
                                    {c('bitcoin buy').t`You got 25% off`}
                                </Pill>
                            )}
                            {selectedQuote.PaymentGatewayFee} {selectedQuote.FiatCurrencySymbol}
                        </div>
                    </div>

                    <div className="flex flex-row justify-space-between">
                        <div>
                            {selectedQuote.PaymentMethod === 'BankTransfer'
                                ? c('bitcoin buy').t`1% bank transfer fee`
                                : c('bitcoin buy').t`4% credit card fee`}
                        </div>
                        {selectedQuote.PaymentProcessingFee} {selectedQuote.FiatCurrencySymbol}
                    </div>

                    <div className="flex flex-row justify-space-between">
                        <div>{c('bitcoin buy').t`BTC network fee`}</div>
                        {selectedQuote.NetworkFee} {selectedQuote.FiatCurrencySymbol}
                    </div>

                    <hr />

                    <div className="flex flex-row text-bold">
                        <div>{c('bitcoin buy').t`You receive`}</div>
                    </div>

                    <div className="flex flex-row justify-space-between">
                        <span>{selectedQuote.BitcoinAmount} BTC</span>
                        <span>
                            {selectedQuote.PurchaseAmount} {selectedQuote.FiatCurrencySymbol}
                        </span>
                    </div>
                </div>

                <div className="flex flex-row flex-nowrap items-center justify-space-between p-6 gap-3 border border-norm rounded-lg">
                    <div className="flex-wrap">
                        {hasWalletPaidPlans
                            ? // translator: you are saving 5 USD on Azteco service fee!
                              c('bitcoin buy')
                                  .t`As a paid user, you are saving ${serviceFeeAmount} ${selectedQuote.FiatCurrencySymbol} on Azteco service fee!`
                            : c('bitcoin buy').t`Upgrade to Visionary plan to reduce service fee to 3%`}
                    </div>
                    {!hasWalletPaidPlans && (
                        <div className="w-1/3 text-right">
                            <Button
                                color="norm"
                                size="small"
                                disabled={!user.canPay}
                                onClick={() => {
                                    openSubscriptionModal({
                                        step: SUBSCRIPTION_STEPS.CHECKOUT,
                                        disablePlanSelection: true,
                                        plan: PLANS.VISIONARY,
                                        onSubscribed: () => {
                                            modalProps.onClose?.();
                                        },
                                        metrics: {
                                            source: 'upsells',
                                        },
                                    });
                                }}
                            >
                                {c('Action').t`Upgrade`}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

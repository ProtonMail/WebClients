import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import RenewToggle, { useRenewToggle } from '@proton/components/containers/payments/RenewToggle';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { useLoading } from '@proton/hooks';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { getPaymentsVersion, setPaymentMethodV4, setPaymentMethodV5, updatePaymentMethod } from '../../core/api';
import type { CardModel } from '../../core/cardDetails';
import { Autopay, PAYMENT_METHOD_TYPES } from '../../core/constants';
import type { PaymentMethodCardDetails } from '../../core/interface';
import { isV5PaymentToken } from '../../core/type-guards';
import { paymentMethodPaymentsVersion, v5PaymentTokenToLegacyPaymentToken } from '../../core/utils';
import { ChargebeeCreditCardWrapper } from '../components/ChargebeeWrapper';

interface Props extends Omit<ModalProps<'form'>, 'as' | 'children' | 'size'> {
    card?: CardModel;
    renewState?: Autopay;
    paymentMethod?: PaymentMethodCardDetails;
    onMethodAdded?: () => void;
    enableRenewToggle?: boolean;
}

const EditCardModal = ({
    card: existingCard,
    renewState,
    paymentMethod,
    onMethodAdded,
    enableRenewToggle = true,
    ...rest
}: Props) => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();

    const { call } = useEventManager();
    const [processing, withProcessing] = useLoading();
    const { createNotification } = useNotifications();
    const title = existingCard ? c('Title').t`Edit credit/debit card` : c('Title').t`Add credit/debit card`;

    const [chargebeeFormInitialized, setChargebeeFormInitialized] = useState(false);

    const {
        onChange: renewOnChange,
        setRenewState,
        ...renewToggleProps
    } = useRenewToggle({ initialRenewState: renewState });

    const chargebeeContext = useChargebeeContext();

    const paymentFacade = usePaymentFacade({
        amount: 0,
        currency: user.Currency,
        flow: 'add-card',
        billingPlatform: subscription?.BillingPlatform,
        chargebeeUserExists: user.ChargebeeUserExists,
        onChargeable: async (_, { chargeablePaymentParameters, sourceType }) => {
            withProcessing(async () => {
                if (!isV5PaymentToken(chargeablePaymentParameters)) {
                    return;
                }

                if (sourceType === PAYMENT_METHOD_TYPES.CARD) {
                    const legacyPaymentToken = v5PaymentTokenToLegacyPaymentToken(chargeablePaymentParameters);
                    await api(
                        setPaymentMethodV4({
                            ...legacyPaymentToken.Payment,
                            Autopay: renewToggleProps.renewState,
                        })
                    );
                } else if (sourceType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
                    await api(
                        setPaymentMethodV5({
                            PaymentToken: chargeablePaymentParameters.PaymentToken,
                            v: 5,
                            Autopay: renewToggleProps.renewState,
                        })
                    );
                }

                await call();
                rest.onClose?.();
                if (existingCard) {
                    createNotification({ text: c('Success').t`Payment method updated` });
                } else {
                    createNotification({ text: c('Success').t`Payment method added` });
                    onMethodAdded?.();
                }
            }).catch(noop);
        },
        user,
    });

    const paymentMethodId = paymentMethod?.ID;
    const process = async () => {
        try {
            await paymentFacade.selectedProcessor?.processPaymentToken();
        } catch (e) {
            const error = getSentryError(e);
            if (error) {
                const context = {
                    hasExistingCard: !!existingCard,
                    renewState,
                    paymentMethodId,
                    processorType: paymentFacade.selectedProcessor?.meta.type,
                    paymentsVersion: getPaymentsVersion(),
                    chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
                };

                captureMessage('Payments: failed to add card', {
                    level: 'error',
                    extra: { error, context },
                });
            }
        }
    };

    const loading = paymentFacade.methods.loading;
    useEffect(() => {
        if (loading) {
            return;
        }

        if (paymentFacade.methods.isMethodTypeEnabled(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD)) {
            paymentFacade.methods.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
        } else {
            paymentFacade.methods.selectMethod(PAYMENT_METHOD_TYPES.CARD);
        }
    }, [loading]);

    const isChargebeeCard = paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
    const formFullyLoaded = isChargebeeCard && chargebeeFormInitialized;

    const content = (
        <>
            {isChargebeeCard && (
                <ChargebeeCreditCardWrapper
                    onInitialized={() => setChargebeeFormInitialized(true)}
                    iframeHandles={paymentFacade.iframeHandles}
                    chargebeeCard={paymentFacade.chargebeeCard}
                    themeCode={paymentFacade.themeCode}
                    initialCountryCode={paymentFacade.methods.status?.CountryCode}
                    showCountry={true}
                />
            )}
            {enableRenewToggle && formFullyLoaded && (
                <RenewToggle
                    loading={processing}
                    onChange={async () => {
                        const result = await renewOnChange();

                        // Case when the change wasn't done. For example because user canceled the change and decided to keep the setting as-is.
                        if (result === null) {
                            return;
                        }

                        // Case when <EditCardModal /> is rendered in Add mode. In this case there is no existing paymentMethodId.
                        if (!paymentMethodId) {
                            return;
                        }

                        void withProcessing(async () => {
                            try {
                                await api(
                                    updatePaymentMethod(
                                        paymentMethodId,
                                        {
                                            Autopay: result,
                                        },
                                        paymentMethodPaymentsVersion(paymentMethod)
                                    )
                                );

                                await call().catch(noop);

                                const text =
                                    result === Autopay.ENABLE
                                        ? c('Subscription renewal state').t`Auto-pay is enabled`
                                        : c('Subscription renewal state').t`Auto-pay is disabled`;
                                createNotification({ text });

                                rest.onClose?.();
                            } catch {
                                setRenewState(result === Autopay.ENABLE ? Autopay.DISABLE : Autopay.ENABLE);
                            }
                        });
                    }}
                    {...renewToggleProps}
                />
            )}
        </>
    );

    return (
        <ModalTwo
            size="small"
            as="form"
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                // it handles the case when the EditCardModal is rendered as part of SubscriptionContainer.
                // We need to prevent premature closing of the SubscriptionContainer by stopping the event propagation
                // and subsequent handling
                event.stopPropagation();
                withProcessing(process()).catch(noop);
            }}
            {...rest}
        >
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                {/* In the future, this spinner can be passed inside of chargebee card component to 
                replace its internal spinner and make to loading animation continious 
                currently there are two stages: first wait till the facade is fully loaded, 
                then wait till the chargebee form is initialized. We need to find a way to use one loading spinner 
                for both stages
                */}
                {/* {loading ? (
                    <div
                        className="flex justify-center items-center h-custom"
                        style={{
                            '--h-custom': '27rem',
                        }}
                    >
                        <CircleLoader size="large" />
                    </div>
                ) : (
                    content
                )} */}
                {content}
            </ModalTwoContent>
            {formFullyLoaded && (
                <ModalTwoFooter>
                    <Button disabled={processing} onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                    <Button loading={processing} color="norm" type="submit" data-testid="edit-card-action-save">{c(
                        'Action'
                    ).t`Save`}</Button>
                </ModalTwoFooter>
            )}
        </ModalTwo>
    );
};

export default EditCardModal;

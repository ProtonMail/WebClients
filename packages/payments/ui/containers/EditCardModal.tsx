import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import RenewToggle, { useRenewToggle } from '@proton/components/containers/payments/RenewToggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useLoading } from '@proton/hooks';
import { CacheType } from '@proton/redux-utilities/interface';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import noop from '@proton/utils/noop';

import { setPaymentMethodV5, updatePaymentMethod } from '../../core/api/api';
import { Autopay, PAYMENT_METHOD_TYPES } from '../../core/constants';
import type { PaymentMethodCardDetails } from '../../core/interface';
import { isV5PaymentToken } from '../../core/type-guards';
import { tracePaymentError } from '../../sentry/capture';
import { ChargebeeCreditCardWrapper } from '../components/ChargebeeWrapper';
import { usePaymentPollers } from '../hooks/usePaymentPollers';

interface Props extends Omit<ModalProps<'form'>, 'as' | 'children' | 'size'> {
    editExistingCard: boolean;
    renewState?: Autopay;
    paymentMethod?: PaymentMethodCardDetails;
    onMethodAdded?: () => void;
    enableRenewToggle?: boolean;
    app: ProductParam;
}

const EditCardModal = ({
    editExistingCard,
    renewState,
    paymentMethod,
    onMethodAdded,
    enableRenewToggle = true,
    app,
    ...rest
}: Props) => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { createPaymentMethodsPoller } = usePaymentPollers();
    const getPaymentMethods = useGetPaymentMethods();

    const [processing, withProcessing] = useLoading();
    const { createNotification } = useNotifications();
    const title = editExistingCard ? c('Title').t`Edit credit/debit card` : c('Title').t`Add credit/debit card`;

    const [chargebeeFormInitialized, setChargebeeFormInitialized] = useState(false);

    const {
        onChange: renewOnChange,
        setRenewState,
        ...renewToggleProps
    } = useRenewToggle({ initialRenewState: renewState });

    const paymentFacade = usePaymentFacade({
        amount: 0,
        currency: user.Currency,
        flow: 'add-card',
        onChargeable: async (_, { chargeablePaymentParameters }) => {
            withProcessing(async () => {
                if (!isV5PaymentToken(chargeablePaymentParameters)) {
                    return;
                }

                const pollPaymentMethods = createPaymentMethodsPoller();

                await api(
                    setPaymentMethodV5({
                        PaymentToken: chargeablePaymentParameters.PaymentToken,
                        v: 5,
                        Autopay: renewToggleProps.renewState,
                    })
                );

                if (editExistingCard) {
                    await getPaymentMethods({ cache: CacheType.None });
                    createNotification({ text: c('Success').t`Payment method updated` });
                } else {
                    // Poll until the new payment method has been added.
                    try {
                        await pollPaymentMethods();
                    } catch {}
                    createNotification({ text: c('Success').t`Payment method added` });
                    onMethodAdded?.();
                }
                rest.onClose?.();
            }).catch(noop);
        },
        user,
        product: app,
        telemetryContext: 'other',
    });

    const paymentMethodId = paymentMethod?.ID;
    const process = async () => {
        try {
            await paymentFacade.selectedProcessor?.processPaymentToken();
        } catch (e) {
            tracePaymentError(e, {
                component: 'edit-card-modal',
                subscription,
                extra: {
                    hasExistingCard: editExistingCard,
                    renewState,
                    paymentMethodId,
                    processorType: paymentFacade.selectedProcessor?.meta.type,
                },
            });
        }
    };

    const loading = paymentFacade.methods.loading;
    useEffect(() => {
        if (loading) {
            return;
        }

        if (paymentFacade.methods.isMethodTypeEnabled(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD)) {
            paymentFacade.methods.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
        }
    }, [loading]);

    const content = (
        <>
            <ChargebeeCreditCardWrapper
                onInitialized={() => setChargebeeFormInitialized(true)}
                iframeHandles={paymentFacade.iframeHandles}
                chargebeeCard={paymentFacade.chargebeeCard}
                themeCode={paymentFacade.themeCode}
                initialCountryCode={paymentFacade.methods.status?.CountryCode}
                showCountry={true}
            />
            {enableRenewToggle && chargebeeFormInitialized && (
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
                                    updatePaymentMethod(paymentMethodId, {
                                        Autopay: result,
                                    })
                                );

                                // Refetch the payment methods to get the updated value.
                                await getPaymentMethods({ cache: CacheType.None });

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
            <ModalTwoContent>{content}</ModalTwoContent>
            {chargebeeFormInitialized && (
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

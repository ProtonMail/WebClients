import { FormEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getDefaultVerifyPayment } from '@proton/components/payments/client-extensions/validators/validators';
import { Autopay, isTokenPayment } from '@proton/components/payments/core';
import { useCard } from '@proton/components/payments/react-extensions';
import { useLoading } from '@proton/hooks';
import { setPaymentMethod, updatePaymentMethod } from '@proton/shared/lib/api/payments';
import noop from '@proton/utils/noop';

import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
import { useApi, useEventManager, useModals, useNotifications } from '../../hooks';
import { CardModel } from '../../payments/core';
import CreditCard from './CreditCard';
import RenewToggle, { useRenewToggle } from './RenewToggle';

interface Props extends Omit<ModalProps<'form'>, 'as' | 'children' | 'size'> {
    card?: CardModel;
    renewState?: Autopay;
    paymentMethodId?: string;
}

const EditCardModal = ({ card: existingCard, renewState, paymentMethodId, ...rest }: Props) => {
    const api = useApi();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const title = existingCard ? c('Title').t`Edit credit/debit card` : c('Title').t`Add credit/debit card`;

    const {
        onChange: renewOnChange,
        setRenewState,
        ...renewToggleProps
    } = useRenewToggle({ initialRenewState: renewState });

    const cardHook = useCard(
        {
            verifyOnly: true,
            amountAndCurrency: {
                Amount: 0,
                Currency: 'USD',
            },
            initialCard: existingCard,
            onChargeable: async (chargeablePaymentParameters) => {
                withLoading(async () => {
                    const { Payment } = chargeablePaymentParameters;
                    if (!isTokenPayment(Payment)) {
                        return;
                    }

                    await api(
                        setPaymentMethod({
                            ...Payment,
                            Autopay: renewToggleProps.renewState,
                        })
                    );
                    await call();
                    rest.onClose?.();
                    createNotification({ text: c('Success').t`Payment method updated` });
                }).catch(noop);
            },
        },
        { api, verifyPayment: getDefaultVerifyPayment(createModal, api) }
    );

    const process = async () => {
        try {
            await cardHook.processPaymentToken();
        } catch {}
    };

    return (
        <ModalTwo
            size="small"
            as="form"
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                withLoading(process()).catch(noop);
            }}
            {...rest}
        >
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <CreditCard
                    card={cardHook.card}
                    errors={cardHook.errors}
                    onChange={cardHook.setCardProperty}
                    loading={loading}
                    fieldsStatus={cardHook.fieldsStatus}
                />
                <RenewToggle
                    loading={loading}
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

                        void withLoading(async () => {
                            try {
                                await api(
                                    updatePaymentMethod(paymentMethodId, {
                                        Autopay: result,
                                    })
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button disabled={loading} onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button loading={loading} color="norm" type="submit" data-testid="edit-card-action-save">{c('Action')
                    .t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default EditCardModal;

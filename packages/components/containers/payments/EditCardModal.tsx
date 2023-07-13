import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import usePaymentToken from '@proton/components/containers/payments/usePaymentToken';
import { Autopay, PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import { setPaymentMethod, updatePaymentMethod } from '@proton/shared/lib/api/payments';
import noop from '@proton/utils/noop';

import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';
import { CardModel } from '../../payments/core';
import CreditCard from './CreditCard';
import RenewToggle, { useRenewToggle } from './RenewToggle';
import toDetails from './toDetails';
import useCard from './useCard';

interface Props extends Omit<ModalProps<'form'>, 'as' | 'children' | 'size'> {
    card?: CardModel;
    renewState?: Autopay;
    paymentMethodId?: string;
}

const EditCardModal = ({ card: existingCard, renewState, paymentMethodId, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const createPaymentToken = usePaymentToken();
    const title = existingCard ? c('Title').t`Edit credit/debit card` : c('Title').t`Add credit/debit card`;
    const { card, setCard, errors, isValid } = useCard({
        initialCard: existingCard,
    });
    const [submitted, setSubmitted] = useState(false);
    const {
        onChange: renewOnChange,
        setRenewState,
        ...renewToggleProps
    } = useRenewToggle({ initialRenewState: renewState });

    const handleSubmit = async () => {
        const { Payment } = await createPaymentToken(
            {
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Details: toDetails(card),
                },
            },
            {
                addCardMode: true,
            }
        );
        await api(setPaymentMethod({ ...Payment, Autopay: renewToggleProps.renewState }));
        await call();
        rest.onClose?.();
        createNotification({ text: c('Success').t`Payment method updated` });
    };

    return (
        <ModalTwo
            size="small"
            as="form"
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                setSubmitted(true);
                if (!isValid) {
                    return;
                }
                withLoading(handleSubmit());
            }}
            {...rest}
        >
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <CreditCard card={card} errors={submitted ? errors : {}} onChange={setCard} loading={loading} />
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

                        withLoading(async () => {
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

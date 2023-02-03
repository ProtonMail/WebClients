import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { setPaymentMethod } from '@proton/shared/lib/api/payments';
import { ADD_CARD_MODE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
import { useApi, useEventManager, useLoading, useModals, useNotifications } from '../../hooks';
import CreditCard from './CreditCard';
import { CardModel } from './interface';
import { handlePaymentToken } from './paymentTokenHelper';
import toDetails from './toDetails';
import useCard from './useCard';

interface Props extends Omit<ModalProps<'form'>, 'as' | 'children' | 'size'> {
    card?: CardModel;
}

const EditCardModal = ({ card: existingCard, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const title = existingCard ? c('Title').t`Edit credit/debit card` : c('Title').t`Add credit/debit card`;
    const { card, setCard, errors, isValid } = useCard(existingCard);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        const { Payment } = await handlePaymentToken({
            // @ts-expect-error TODO: Fix these types
            params: {
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Details: toDetails(card),
                },
            },
            mode: ADD_CARD_MODE,
            api,
            createModal,
        });
        await api(setPaymentMethod(Payment));
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button disabled={loading} onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button loading={loading} color="norm" type="submit">{c('Action').t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default EditCardModal;

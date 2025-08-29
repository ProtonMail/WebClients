import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import type { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import ConfirmModal from '@proton/components/components/modal/Confirm';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useModals from '@proton/components/hooks/useModals';
import useNotifications from '@proton/components/hooks/useNotifications';
import {
    type CardModel,
    PAYMENT_METHOD_TYPES,
    type PaymentMethodCardDetails,
    type SavedPaymentMethod,
    deletePaymentMethod,
    isExpired,
    markPaymentMethodAsDefault,
} from '@proton/payments';
import { EditCardModal } from '@proton/payments/ui';

const toCardModel = ({ Details }: PaymentMethodCardDetails): CardModel => {
    return {
        month: `${Details.ExpMonth}`, // ExpMonth is a number
        number: '',
        year: `${Details.ExpYear}`.slice(-2), // ExpYear is a number
        cvc: '',
        zip: Details.ZIP,
        country: Details.Country,
    };
};

export interface Props {
    method: SavedPaymentMethod;
    methods: SavedPaymentMethod[];
}

const PaymentMethodActions = ({ method, methods }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();

    const deleteMethod = async () => {
        await api(deletePaymentMethod(method.ID, 'v5'));
        await call();
        createNotification({ text: c('Success').t`Payment method deleted` });
    };

    const markAsDefault = async () => {
        await markPaymentMethodAsDefault(api, method.ID, methods);
        await call();
        createNotification({ text: c('Success').t`Payment method updated` });
    };

    const dropdownActions: DropdownActionProps[] = [];

    if (method.Type === PAYMENT_METHOD_TYPES.CARD) {
        const card: CardModel = toCardModel(method);

        dropdownActions.push({
            text: c('Action').t`Edit`,
            onClick: () =>
                createModal(<EditCardModal card={card} renewState={method.Autopay} paymentMethod={method} />),
            'data-testid': 'Edit',
        });
    }

    if (!method.IsDefault && !isExpired(method.Details)) {
        dropdownActions.push({
            text: c('Action').t`Mark as default`,
            onClick: markAsDefault,
        });
    }

    dropdownActions.push({
        text: c('Action').t`Delete`,
        actionType: 'delete',
        'data-testid': 'Delete',
        onClick: () => {
            createModal(
                <ConfirmModal
                    onConfirm={deleteMethod}
                    title={c('Confirmation title').t`Delete payment method`}
                    confirm={<Button color="danger" type="submit">{c('Action').t`Delete`}</Button>}
                >
                    <Alert className="mb-4" data-testid="valid-payment-alert">{c('Info when deleting payment method')
                        .t`To avoid any service interruption due to unpaid invoices, please make sure that you have at least 1 valid payment method saved at any point in time.`}</Alert>
                    <Alert className="mb-4" type="error" data-testid="confirmation-alert">{c(
                        'Confirmation message to delete payment method'
                    ).t`Are you sure you want to delete this payment method?`}</Alert>
                </ConfirmModal>
            );
        },
    });

    return <DropdownActions size="small" list={dropdownActions} />;
};

export default PaymentMethodActions;

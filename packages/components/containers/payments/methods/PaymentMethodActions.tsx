import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import ErrorButton from '@proton/components/components/button/ErrorButton';
import type { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import ConfirmModal from '@proton/components/components/modal/Confirm';
import {
    type CardModel,
    PAYMENT_METHOD_TYPES,
    type PaymentMethodCardDetails,
    type SavedPaymentMethod,
    isExpired,
    paymentMethodPaymentsVersion,
} from '@proton/payments';
import type { PaymentsVersion } from '@proton/shared/lib/api/payments';
import { deletePaymentMethod, orderPaymentMethods } from '@proton/shared/lib/api/payments';

import { useApi, useEventManager, useModals, useNotifications } from '../../../hooks';
import EditCardModal from '../../payments/EditCardModal';

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
    index: number;
    method: SavedPaymentMethod;
    methods: SavedPaymentMethod[];
}

const PaymentMethodActions = ({ method, methods, index }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const apiVersion: PaymentsVersion = paymentMethodPaymentsVersion(method);

    const deleteMethod = async () => {
        await api(deletePaymentMethod(method.ID, apiVersion));
        await call();
        createNotification({ text: c('Success').t`Payment method deleted` });
    };

    const markAsDefault = async () => {
        const IDs = methods.map(({ ID }) => ID);

        IDs.splice(index, 1);
        IDs.unshift(method.ID);
        await api(orderPaymentMethods(IDs, apiVersion));
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

    if (index > 0 && !isExpired(method.Details)) {
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
                    confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
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

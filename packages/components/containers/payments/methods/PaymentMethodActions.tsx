import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { DropdownActionProps } from '@proton/components/components/dropdown/DropdownActions';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
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
import noop from '@proton/utils/noop';

import useModalState, { useModalStateWithData } from '../../../components/modalTwo/useModalState';
import Prompt from '../../../components/prompt/Prompt';

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
    const [loadingDelete, withLoadingDelete] = useLoading();
    const [confirmDeleteProps, setConfirmDeleteModal, renderConfirmDeleteModal] = useModalState();
    const [{ data: editModalPropsData, ...editModalProps }, setEditModal, renderEditModal] = useModalStateWithData<{
        card: CardModel;
        method: PaymentMethodCardDetails;
    }>();
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
            key: 'edit',
            text: c('Action').t`Edit`,
            onClick: () => setEditModal({ card, method }),
            'data-testid': 'Edit',
        });
    }

    if (!method.IsDefault && !isExpired(method.Details)) {
        dropdownActions.push({
            key: 'mark-default',
            text: c('Action').t`Mark as default`,
            onClick: markAsDefault,
        });
    }

    dropdownActions.push({
        key: 'delete',
        text: c('Action').t`Delete`,
        actionType: 'delete',
        'data-testid': 'Delete',
        onClick: () => {
            setConfirmDeleteModal(true);
        },
    });

    return (
        <>
            {renderEditModal && editModalPropsData && (
                <EditCardModal
                    {...editModalProps}
                    card={editModalPropsData.card}
                    renewState={editModalPropsData.method.Autopay}
                    paymentMethod={editModalPropsData.method}
                />
            )}
            {renderConfirmDeleteModal && (
                <Prompt
                    {...confirmDeleteProps}
                    title={c('Confirmation title').t`Delete payment method`}
                    buttons={[
                        <Button
                            data-testid="confirm-deletion"
                            loading={loadingDelete}
                            color="danger"
                            onClick={() => {
                                withLoadingDelete(deleteMethod())
                                    .then(() => {
                                        confirmDeleteProps.onClose();
                                    })
                                    .catch(noop);
                            }}
                        >{c('Action').t`Delete`}</Button>,
                        <Button onClick={confirmDeleteProps.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    <p className="mb-4" data-testid="valid-payment-alert">
                        {c('Info when deleting payment method')
                            .t`To avoid any service interruption due to unpaid invoices, please make sure that you have at least 1 valid payment method saved at any point in time.`}
                    </p>
                    <p className="mb-4" data-testid="confirmation-alert">{c(
                        'Confirmation message to delete payment method'
                    ).t`Are you sure you want to delete this payment method?`}</p>
                </Prompt>
            )}
            <DropdownActions size="small" list={dropdownActions} />
        </>
    );
};

export default PaymentMethodActions;

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import { deletePaymentMethod, markPaymentMethodAsDefault } from '@proton/payments/core/api/api';
import { isCardExpired } from '@proton/payments/core/cardDetails';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PaymentMethodCardDetails, SavedPaymentMethod } from '@proton/payments/core/interface';
import EditCardModal from '@proton/payments/ui/containers/EditCardModal';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import type { DropdownActionProps } from '../../../components/dropdown/DropdownActions';
import DropdownActions from '../../../components/dropdown/DropdownActions';
import useModalState, { useModalStateWithData } from '../../../components/modalTwo/useModalState';
import Prompt from '../../../components/prompt/Prompt';
import useEventManager from '../../../hooks/useEventManager';

export interface Props {
    method: SavedPaymentMethod;
    methods: SavedPaymentMethod[];
    app: APP_NAMES;
}

const PaymentMethodActions = ({ method, methods, app }: Props) => {
    const { createNotification } = useNotifications();
    const [loadingDelete, withLoadingDelete] = useLoading();
    const [confirmDeleteProps, setConfirmDeleteModal, renderConfirmDeleteModal] = useModalState();
    const [{ data: editModalPropsData, ...editModalProps }, setEditModal, renderEditModal] = useModalStateWithData<{
        method: PaymentMethodCardDetails;
    }>();
    const api = useApi();
    const { call } = useEventManager();

    const deleteMethod = async () => {
        await api(deletePaymentMethod(method.ID));
        await call();
        createNotification({ text: c('Success').t`Payment method deleted` });
    };

    const markAsDefault = async () => {
        await markPaymentMethodAsDefault(api, method.ID, methods);
        await call();
        createNotification({ text: c('Success').t`Payment method updated` });
    };

    const dropdownActions: DropdownActionProps[] = [];

    if (method.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
        dropdownActions.push({
            key: 'edit',
            text: c('Action').t`Edit`,
            onClick: () => setEditModal({ method }),
            'data-testid': 'Edit',
        });
    }

    if (!method.IsDefault && !isCardExpired(method.Details)) {
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
                    editExistingCard={true}
                    renewState={editModalPropsData.method.Autopay}
                    paymentMethod={editModalPropsData.method}
                    app={app}
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

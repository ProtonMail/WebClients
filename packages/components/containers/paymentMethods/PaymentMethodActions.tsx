import PropTypes from 'prop-types';
import { c } from 'ttag';

import { deletePaymentMethod, orderPaymentMethods } from '@proton/shared/lib/api/payments';
import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { isExpired } from '@proton/shared/lib/helpers/card';

import { Alert, ConfirmModal, DropdownActions, ErrorButton } from '../../components';
import { useApi, useEventManager, useModals, useNotifications } from '../../hooks';
import EditCardModal from '../payments/EditCardModal';

const toCard = ({ Details = {}, Type }: any) => {
    if (Type === 'card') {
        return {
            fullname: Details.Name,
            month: `${Details.ExpMonth}`, // ExpMonth is a number
            number: '',
            year: `${Details.ExpYear}`.slice(-2), // ExpYear is a number
            cvc: '',
            zip: Details.ZIP,
            country: Details.Country,
        };
    }
    return Details;
};

const PaymentMethodActions = ({ method, methods, index }: any) => {
    const card = toCard(method);
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();

    const deleteMethod = async () => {
        await api(deletePaymentMethod(method.ID));
        await call();
        createNotification({ text: c('Success').t`Payment method deleted` });
    };

    const markAsDefault = async () => {
        const IDs = methods.map(({ ID }: any) => ID);

        IDs.splice(index, 1);
        IDs.unshift(method.ID);
        await api(orderPaymentMethods(IDs));
        await call();
        createNotification({ text: c('Success').t`Payment method updated` });
    };

    const list: any = [
        method.Type === PAYMENT_METHOD_TYPES.CARD && {
            text: c('Action').t`Edit`,
            onClick: () => createModal(<EditCardModal card={card} />),
        },
        index > 0 &&
            !isExpired(method.Details) && {
                text: c('Action').t`Mark as default`,
                onClick: markAsDefault,
            },
        {
            text: c('Action').t`Delete`,
            actionType: 'delete',
            onClick: () => {
                createModal(
                    <ConfirmModal
                        onConfirm={deleteMethod}
                        title={c('Confirmation title').t`Delete payment method`}
                        confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    >
                        <Alert className="mb1">{c('Info when deleting payment method')
                            .t`To avoid any service interruption due to unpaid invoices, please make sure that you have at least 1 valid payment method saved at any point in time.`}</Alert>
                        <Alert className="mb1" type="error">{c('Confirmation message to delete payment method')
                            .t`Are you sure you want to delete this payment method?`}</Alert>
                    </ConfirmModal>
                );
            },
        },
    ].filter(Boolean);

    return <DropdownActions size="small" list={list} />;
};

PaymentMethodActions.propTypes = {
    method: PropTypes.object.isRequired,
    methods: PropTypes.array.isRequired,
    index: PropTypes.number.isRequired,
};

export default PaymentMethodActions;

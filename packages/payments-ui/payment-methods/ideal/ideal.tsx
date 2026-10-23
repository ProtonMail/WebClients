import { c } from 'ttag';

import { IDEAL_WERO_BRAND_NAME } from '@proton/chargebee/lib/constants';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import idealMarkSvg from '@proton/styles/assets/img/bank-icons/ideal.svg';

import type { PaymentMethodUi } from '../paymentMethodUi';
import { getBankTransferLabel, renderBankAccountTableCell } from '../sepa/sepa';

export const idealPaymentMethodUi: PaymentMethodUi<PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL> = {
    newMethodView: () => ({ text: IDEAL_WERO_BRAND_NAME }),
    renderOptionMark: () => (
        <span className="mr-2 w-custom" style={{ '--w-custom': '3.5rem' }}>
            <img
                src={idealMarkSvg}
                alt={c('Info').t`${IDEAL_WERO_BRAND_NAME} mark`}
                style={{ marginTop: '-0.15625rem' }}
            />
        </span>
    ),
    savedMethodLabel: getBankTransferLabel,
    renderSavedMethodTableCell: renderBankAccountTableCell,
};

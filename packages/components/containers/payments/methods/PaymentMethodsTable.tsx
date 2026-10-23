import { c } from 'ttag';

import { getSavedMethodUi } from '@proton/payments-ui/payment-methods/paymentMethodUiRegistry';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableHeader from '../../../components/table/TableHeader';
import TableRow from '../../../components/table/TableRow';
import PaymentMethodActions from './PaymentMethodActions';
import PaymentMethodState from './PaymentMethodState';

interface Props {
    methods: SavedPaymentMethod[];
    app: APP_NAMES;
}

const MethodCell = ({ method }: { method: SavedPaymentMethod }) => {
    if (!method.Details) {
        return null;
    }

    return getSavedMethodUi(method.Type)?.renderSavedMethodTableCell?.(method.Details) ?? null;
};

const PaymentMethodsTable = ({ methods, app }: Props) => {
    if (!methods.length) {
        return <p data-testid="no-payments">{c('Info').t`You have no saved payment methods.`}</p>;
    }

    return (
        <Table hasActions responsive="cards">
            <TableHeader
                cells={[
                    c('Title for payment methods table').t`Method`,
                    c('Title for payment methods table').t`Status`,
                    c('Title for payment methods table').t`Actions`,
                ]}
            />
            <TableBody colSpan={3}>
                {methods.map((method) => {
                    return (
                        <TableRow
                            key={method.ID}
                            cells={[
                                <MethodCell method={method} />,
                                <PaymentMethodState key={method.ID} method={method} />,
                                <PaymentMethodActions key={method.ID} app={app} method={method} methods={methods} />,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default PaymentMethodsTable;

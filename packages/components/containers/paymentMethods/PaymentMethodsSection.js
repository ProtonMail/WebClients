import React, { useState, useEffect, useContext } from 'react';
import { c } from 'ttag';
import { SubTitle, PrimaryButton, Alert, Block, Table, TableHeader, TableBody, LearnMore } from 'react-components';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';
import ContextApi from 'proton-shared/lib/context/api';

import PaymentMethodActions from './PaymentMethodActions';
import PaymentMethodState from './PaymentMethodState';

const PaymentMethodsSection = () => {
    const { api } = useContext(ContextApi);
    const handleAddPaymentMethod = () => {};
    const [methods, setMethods] = useState([]);
    const fetchMethods = async () => {
        const { PaymentMethods } = await api(queryPaymentMethods());
        setMethods(PaymentMethods);
    };
    const TYPES = {
        card: c('Label in payment methods table').t`Credit card`
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    return (
        <>
            <SubTitle>{c('Title').t`Payment methods`}</SubTitle>
            <Alert>
                {c('Info for payment methods').t`Lorem ipsum`}
                <br />
                <LearnMore url="todo"/>
            </Alert>
            <Block>
                <PrimaryButton onClick={handleAddPaymentMethod}>{c('Action').t`Add payment method`}</PrimaryButton>
            </Block>
            <Table>
                <TableHeader cells={[
                    c('Title for payment methods table').t`Method`,
                    c('Title for payment methods table').t`NR`,
                    c('Title for payment methods table').t`Name`,
                    c('Title for payment methods table').t`Status`,
                    c('Title for payment methods table').t`Actions`
                ]} />
                <TableBody>
                    {methods.map((method, index) => {
                        return <TableRow key={method.ID} cells={[
                            `${TYPES[method.Type]} (${method.Details.Brand})`,
                            `•••• •••• •••• ${method.Details.Last4}`,
                            method.Details.Name,
                            <PaymentMethodState key={method.ID} method={method} index={index} />,
                            <PaymentMethodActions key={method.ID} method={method} onChange={fetchMethods} />
                        ]} />;
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default PaymentMethodsSection;
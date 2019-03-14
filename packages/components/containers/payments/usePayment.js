import { useState, useEffect } from 'React';

const usePayment = (submit) => {
    const [method, setMethod] = useState('');
    const [parameters, setParameters] = useState({});
    const [isCardValid, setCardValidity] = useState(false);

    const canPay = () => {
        if (['paypal', 'bitcoin', 'cash'].includes(method)) {
            return false;
        }

        if (method === 'card' && !isCardValid) {
            return false;
        }

        return true;
    };

    useEffect(() => {
        if (method === 'paypal') {
            submit();
        }
    }, [parameters]);

    return {
        method,
        setMethod,
        parameters,
        setParameters,
        canPay: canPay(),
        setCardValidity
    };
};

export default usePayment;

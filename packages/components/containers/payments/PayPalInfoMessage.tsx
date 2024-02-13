import { c } from 'ttag';

const PayPalInfoMessage = () => {
    const payPalInfoMessage = c('Info')
        .t`We will redirect you to PayPal in a new browser tab to complete this transaction. If you use any pop-up blockers, please disable them to continue.`;

    return <div>{payPalInfoMessage}</div>;
};

export default PayPalInfoMessage;

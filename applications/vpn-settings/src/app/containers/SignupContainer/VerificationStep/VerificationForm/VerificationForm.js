import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNotifications } from '@proton/components';
import { c } from 'ttag';
import VerificationMethodForm from './VerificationMethodForm/VerificationMethodForm';
import VerificationCodeForm from './VerificationCodeForm/VerificationCodeForm';

const VerificationForm = ({ defaultCountry, defaultEmail, allowedMethods, onRequestCode, onSubmit, onCaptcha }) => {
    const { createNotification } = useNotifications();
    const [params, setParams] = useState(null);

    const handleBack = () => setParams(null);

    const sendCode = async (params) => {
        const destination = params.Destination.Phone || params.Destination.Address;
        await onRequestCode(params);
        createNotification({ text: c('Notification').t`Verification code successfully sent to ${destination}` });
    };

    const handleResendCode = () => sendCode(params);

    const handleRequestCode = async (params) => {
        await sendCode(params);
        setParams(params);
    };

    const handleSubmitCode = (code) => onSubmit(code, params);

    if (!params) {
        return (
            <VerificationMethodForm
                defaultCountry={defaultCountry}
                defaultEmail={defaultEmail}
                allowedMethods={allowedMethods}
                onSubmit={handleRequestCode}
                onCaptcha={onCaptcha}
            />
        );
    }

    return (
        <VerificationCodeForm
            destination={params.Destination}
            onSubmit={handleSubmitCode}
            onBack={handleBack}
            onResend={handleResendCode}
        />
    );
};

VerificationForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onCaptcha: PropTypes.func.isRequired,
    onRequestCode: PropTypes.func.isRequired,
    defaultEmail: PropTypes.string.isRequired,
    defaultCountry: PropTypes.string,
    allowedMethods: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default VerificationForm;

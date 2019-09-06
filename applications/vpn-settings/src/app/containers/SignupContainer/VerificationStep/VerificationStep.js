import React from 'react';
import PropTypes from 'prop-types';
import { Row, Alert, SubTitle } from 'react-components';
import VerificationForm from './VerificationForm/VerificationForm';
import useVerification from './useVerification';
import { c } from 'ttag';

const VerificationStep = ({ onVerificationDone, allowedMethods, model, children }) => {
    const { verify, requestCode } = useVerification();

    const handleSubmit = async (code, params) => {
        const newEmail = params.Destination.Address;
        const verificationToken = await verify(code, params);

        await onVerificationDone(
            { ...model, email: newEmail && newEmail !== model.email ? newEmail : model.email },
            verificationToken
        );
    };

    return (
        <>
            <SubTitle>{c('Title').t`Are you human?`}</SubTitle>
            <Row>
                <div>
                    <Alert>{c('Info').t`To prevent misuse, please verify you are human`}</Alert>
                    <VerificationForm
                        allowedMethods={allowedMethods}
                        defaultEmail={model.email}
                        onRequestCode={requestCode}
                        onSubmit={handleSubmit}
                    />
                </div>
                {children}
            </Row>
        </>
    );
};

VerificationStep.propTypes = {
    model: PropTypes.shape({
        email: PropTypes.string
    }).isRequired,
    allowedMethods: PropTypes.arrayOf(PropTypes.string).isRequired,
    onVerificationDone: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default VerificationStep;

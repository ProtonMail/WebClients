import React from 'react';
import PropTypes from 'prop-types';
import { Row, Alert, SubTitle } from 'react-components';
import VerificationForm from './VerificationForm/VerificationForm';
import { c } from 'ttag';

const VerificationStep = ({ onVerify, requestCode, allowedMethods, model, children }) => {
    const handleSubmit = async (code, params) => {
        const newEmail = params.Destination.Address;

        await onVerify(
            { ...model, email: newEmail && newEmail !== model.email ? newEmail : model.email },
            code,
            params
        );
    };

    return (
        <div className="border-top pt3 mb2">
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
        </div>
    );
};

VerificationStep.propTypes = {
    model: PropTypes.shape({
        email: PropTypes.string
    }).isRequired,
    allowedMethods: PropTypes.arrayOf(PropTypes.string).isRequired,
    onVerify: PropTypes.func.isRequired,
    requestCode: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default VerificationStep;

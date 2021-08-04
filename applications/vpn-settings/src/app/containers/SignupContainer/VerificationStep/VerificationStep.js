import PropTypes from 'prop-types';
import { Row, Alert, SubTitle } from '@proton/components';
import { c } from 'ttag';

import VerificationForm from './VerificationForm/VerificationForm';
import LoginPanel from '../LoginPanel';

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
        <div className="pt2 mb2">
            <SubTitle>{c('Title').t`Are you human?`}</SubTitle>
            <Row className="wauto flex-item-fluid-auto">
                <div className="w100">
                    <Alert>{c('Info')
                        .t`To prevent misuse, please verify you are human. Please do not close this tab until you have verified your account.`}</Alert>
                    <VerificationForm
                        allowedMethods={allowedMethods}
                        defaultEmail={model.email}
                        onRequestCode={requestCode}
                        onSubmit={handleSubmit}
                    />
                    <LoginPanel />
                </div>
                {children}
            </Row>
        </div>
    );
};

VerificationStep.propTypes = {
    model: PropTypes.shape({
        email: PropTypes.string,
    }).isRequired,
    allowedMethods: PropTypes.arrayOf(PropTypes.string).isRequired,
    onVerify: PropTypes.func.isRequired,
    requestCode: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
};

export default VerificationStep;

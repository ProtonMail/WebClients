import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Row,
    Field,
    Input,
    PrimaryButton,
    Label,
    InlineLinkButton,
    useLoading,
    Alert,
    useModals,
} from '@proton/components';
import { c } from 'ttag';
import ResendCodeModal from './ResendCodeModal';

const VerificationCodeForm = ({ onSubmit, onResend, onBack, destination }) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const [code, setCode] = useState('');
    const destinationText = <strong key="destination">{destination.Address || destination.Phone}</strong>;

    const handleResend = () => {
        createModal(<ResendCodeModal onBack={onBack} onResend={onResend} destination={destination} />);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        withLoading(onSubmit(code));
    };

    const handleChangeCode = ({ target }) => setCode(target.value);

    return (
        <div>
            <h3>{c('Title').t`Enter verification code`}</h3>
            <Alert>
                <div>{c('Info').jt`Enter the verification code that was sent to ${destinationText}.`}</div>
                {destination.Address ? (
                    <div>{c('Info').t`If you don't find the email in your inbox, please check your spam folder.`}</div>
                ) : null}
            </Alert>
            <form onSubmit={handleSubmit}>
                <Row>
                    <Label htmlFor="code">{c('Label').t`6-digit code`}</Label>
                    <Field className="mr1 wauto flex-item-fluid">
                        <Input
                            id="code"
                            className="mb1"
                            value={code}
                            onChange={handleChangeCode}
                            placeholder="123456"
                            autoFocus
                            required
                        />
                        <div className="mb1">
                            <PrimaryButton disabled={!code} type="submit" loading={loading}>{c('Action')
                                .t`Verify`}</PrimaryButton>
                        </div>
                        <div className="mb1">
                            <InlineLinkButton onClick={handleResend}>{c('Action')
                                .t`Did not receive the code?`}</InlineLinkButton>
                        </div>
                        <div>
                            <InlineLinkButton className="mr0-5" onClick={onBack}>{c('Action')
                                .t`Use another verification method`}</InlineLinkButton>
                        </div>
                    </Field>
                </Row>
            </form>
        </div>
    );
};

VerificationCodeForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onResend: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
    destination: PropTypes.shape({
        Phone: PropTypes.string,
        Address: PropTypes.string,
    }),
};

export default VerificationCodeForm;

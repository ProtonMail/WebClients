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
    useModals
} from 'react-components';
import { c } from 'ttag';
import ResendCodeModal from './ResendCodeModal';

const VerificationCodeForm = ({ onSubmit, onResend, onBack, destination }) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const [code, setCode] = useState('');
    const destinationText = <strong key="destination">{destination.Email || destination.Phone}</strong>;

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
            <Alert>{c('Info').jt`Enter the verification code that was sent to ${destinationText}`}</Alert>
            <form onSubmit={handleSubmit}>
                <Row>
                    <Label htmlFor="code">{c('Label').t`6-digit code`}</Label>
                    <Field className="mr1">
                        <Input id="code" value={code} onChange={handleChangeCode} placeholder="123456" />
                        <Row className="flex-spacebetween mt1">
                            <InlineLinkButton className="mr0-5" onClick={handleResend}>{c('Action')
                                .t`Did not receive the code?`}</InlineLinkButton>
                            <div>
                                <PrimaryButton disabled={!code} type="submit" loading={loading}>{c('Action')
                                    .t`Verify`}</PrimaryButton>
                            </div>
                        </Row>
                        <InlineLinkButton className="mt2 mr0-5" onClick={onBack}>{c('Action')
                            .t`Use another verification method`}</InlineLinkButton>
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
        Email: PropTypes.string
    })
};

export default VerificationCodeForm;

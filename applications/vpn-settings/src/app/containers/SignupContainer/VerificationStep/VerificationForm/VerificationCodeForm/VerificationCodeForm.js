import { useState } from 'react';
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

const VerificationCodeForm = ({ notices, checkSpamFolder, onSubmit, onResend, onBack, destination }) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const [code, setCode] = useState('');
    const destinationText = <strong key="destination">{destination.Address || destination.Phone}</strong>;

    const handleResend = () => {
        createModal(
            <ResendCodeModal notices={notices} onBack={onBack} onResend={onResend} destination={destination} />
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        withLoading(onSubmit(code));
    };

    const handleChangeCode = ({ target }) => setCode(target.value);
    // translator: spam folder" is put in bold in the sentence "please check your spam folder"
    const spamFolder = <strong key="spam-folder">{c('Info').t`spam folder`}</strong>;

    return (
        <div>
            <h3>{c('Title').t`Enter verification code`}</h3>
            <Alert className="mb1">
                <div>{c('Info').jt`Enter the verification code that was sent to ${destinationText}.`}</div>
                {checkSpamFolder || destination.Address ? (
                    <div>{
                        // translator: spamFolder is just "spam folder" in bold
                        c('Info').jt`If you don't find the email in your inbox, please check your ${spamFolder}.`
                    }</div>
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
    notices: PropTypes.element,
    checkSpamFolder: PropTypes.bool,
    destination: PropTypes.shape({
        Phone: PropTypes.string,
        Address: PropTypes.string,
    }),
};

export default VerificationCodeForm;

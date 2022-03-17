import { useState } from 'react';
import PropTypes from 'prop-types';
import { Row, useLoading, Radio, Label, Field, Loader } from '@proton/components';
import { c } from 'ttag';
import Captcha from '@proton/components/containers/api/humanVerification/Captcha';
import { TOKEN_TYPES } from '@proton/shared/lib/constants';
import { languageCode } from '@proton/shared/lib/i18n';

import VerificationEmailInput from './VerificationEmailInput';
import VerificationPhoneInput from './VerificationPhoneInput';

const VERIFICATION_METHOD = {
    EMAIL: TOKEN_TYPES.EMAIL,
    SMS: TOKEN_TYPES.SMS,
    CAPTCHA: TOKEN_TYPES.CAPTCHA,
};

const VerificationMethodForm = ({ defaultCountry, defaultEmail, allowedMethods, onSubmit, onCaptcha }) => {
    const isMethodAllowed = (method) => allowedMethods.includes(method);
    const isCaptchaDefault =
        (defaultCountry === 'RU' || languageCode === 'ru') && !defaultEmail.toLowerCase().endsWith('gmail.com');
    const defaultMethod = Object.values(VERIFICATION_METHOD)
        .sort((a, b) => {
            if (isCaptchaDefault) {
                if (a === VERIFICATION_METHOD.CAPTCHA) {
                    return -1;
                }
                if (b === VERIFICATION_METHOD.CAPTCHA) {
                    return 1;
                }
            }
            return 0;
        })
        .find(isMethodAllowed);

    const [loading, withLoading] = useLoading();
    const [method, setMethod] = useState(defaultMethod);

    const handleSendEmailCode = (Address) =>
        withLoading(onSubmit({ Type: VERIFICATION_METHOD.EMAIL, Destination: { Address } }));
    const handleSendSMSCode = (Phone) =>
        withLoading(onSubmit({ Type: VERIFICATION_METHOD.SMS, Destination: { Phone } }));

    const handleCaptcha = (token) => {
        withLoading(onCaptcha({ TokenType: VERIFICATION_METHOD.CAPTCHA, Token: token }));
    };

    const handleSelectMethod = (method) => () => setMethod(method);

    return (
        <div>
            <h3>{c('Title').t`Select an account verification method`}</h3>

            {allowedMethods.length ? (
                <Row>
                    <Label>{c('Label').t`Verification method`}</Label>
                    <Field className="wauto flex-item-fluid-auto">
                        <div className="pt0-5 mb1">
                            {isMethodAllowed(VERIFICATION_METHOD.EMAIL) ? (
                                <Radio
                                    className="mr1"
                                    name="verificationMethod"
                                    checked={method === VERIFICATION_METHOD.EMAIL}
                                    onChange={handleSelectMethod(VERIFICATION_METHOD.EMAIL)}
                                >{c('Option').t`Email address`}</Radio>
                            ) : null}
                            {isMethodAllowed(VERIFICATION_METHOD.SMS) && (
                                <Radio
                                    className="mr1"
                                    name="verificationMethod"
                                    checked={method === VERIFICATION_METHOD.SMS}
                                    onChange={handleSelectMethod(VERIFICATION_METHOD.SMS)}
                                >{c('Option').t`SMS`}</Radio>
                            )}
                            {isMethodAllowed(VERIFICATION_METHOD.CAPTCHA) && (
                                <Radio
                                    name="verificationMethod"
                                    checked={method === VERIFICATION_METHOD.CAPTCHA}
                                    onChange={handleSelectMethod(VERIFICATION_METHOD.CAPTCHA)}
                                >{c('Option').t`Captcha`}</Radio>
                            )}
                        </div>
                        <div>
                            {method === VERIFICATION_METHOD.EMAIL && (
                                <VerificationEmailInput
                                    loading={loading}
                                    defaultEmail={defaultEmail}
                                    onSendClick={handleSendEmailCode}
                                />
                            )}
                            {method === VERIFICATION_METHOD.SMS && (
                                <VerificationPhoneInput
                                    loading={loading}
                                    onSendClick={handleSendSMSCode}
                                    defaultCountry={defaultCountry}
                                />
                            )}
                            {method === VERIFICATION_METHOD.CAPTCHA && (
                                <>
                                    {loading ? (
                                        <Loader size="medium" />
                                    ) : (
                                        <Captcha token="signup" onSubmit={handleCaptcha} />
                                    )}
                                </>
                            )}
                        </div>
                    </Field>
                </Row>
            ) : null}
        </div>
    );
};

VerificationMethodForm.propTypes = {
    defaultEmail: PropTypes.string.isRequired,
    defaultCountry: PropTypes.string,
    allowedMethods: PropTypes.arrayOf(PropTypes.string).isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCaptcha: PropTypes.func.isRequired,
};

export default VerificationMethodForm;

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormModal, Alert, Row, Label } from 'react-components';
import { c } from 'ttag';

import Captcha from './Captcha';

const HumanVerificationModal = ({ token, methods = [], onSuccess, ...rest }) => {
    const title = c('Title').t`Human verification`;
    const [method] = useState('captcha');

    const handleCaptcha = (token) => {
        onSuccess({ token, method });
        rest.onClose();
    };

    return (
        <FormModal hasClose={false} hasSubmit={false} title={title} {...rest}>
            <Alert type="warning">{c('Info').t`For security reasons, please verify that you are not a robot.`}</Alert>
            {methods.includes('captcha') ? (
                <Row>
                    <Label htmlFor="captcha">{c('Label').t`Captcha`}</Label>
                    <div className="w100">
                        <Captcha token={token} onSubmit={handleCaptcha} />
                    </div>
                </Row>
            ) : null}
        </FormModal>
    );
};

HumanVerificationModal.propTypes = {
    token: PropTypes.string,
    methods: PropTypes.arrayOf(PropTypes.string),
    onSuccess: PropTypes.func
};

export default HumanVerificationModal;

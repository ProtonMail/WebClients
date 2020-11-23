import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { validateCredit, buyCredit } from 'proton-shared/lib/api/payments';
import { isValid } from 'proton-shared/lib/helpers/giftCode';

import { FormModal, Alert, Row, Field, Label } from '../../components';
import { useApiWithoutResult, useEventManager, useNotifications, useLoading } from '../../hooks';

import GiftCodeInput from './GiftCodeInput';

const GiftCodeModal = ({ onClose, ...rest }) => {
    const [loading, withLoading] = useLoading();
    const { request: requestBuyCredit } = useApiWithoutResult(buyCredit);
    const { request: requestValidateCredit } = useApiWithoutResult(validateCredit);
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [value, setValue] = useState('');
    const handleChange = ({ target }) => setValue(target.value.replace(/\s/g, ''));

    const handleSubmit = async () => {
        if (!isValid(value)) {
            createNotification({ text: c('Error').t`Invalid gift code`, type: 'error' });
            return;
        }

        await requestValidateCredit({ GiftCode: value });
        await requestBuyCredit({ GiftCode: value, Amount: 0 });
        await call();
        onClose();
        createNotification({ text: c('Success').t`Gift code applied` });
    };

    return (
        <FormModal
            small
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
            loading={loading}
            title={c('Title').t`Gift code`}
            close={c('Action').t`Close`}
            submit={c('Action').t`Apply`}
            {...rest}
        >
            <Alert>{c('Info').t`If you purchased or were given a gift code, add it here.`}</Alert>
            <Row>
                <Label htmlFor="giftCodeInput">{c('Label').t`Enter gift code`}</Label>
                <Field>
                    <GiftCodeInput id="giftCodeInput" value={value} onChange={handleChange} required autoFocus />
                </Field>
            </Row>
        </FormModal>
    );
};

GiftCodeModal.propTypes = {
    onClose: PropTypes.func,
};

export default GiftCodeModal;

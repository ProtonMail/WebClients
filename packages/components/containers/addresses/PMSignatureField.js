import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PM_SIGNATURE } from 'proton-shared/lib/constants';
import { updatePMSignature } from 'proton-shared/lib/api/mailSettings';
import { useMailSettings, useToggle, useNotifications, useEventManager, useApiWithoutResult } from '../../hooks';
import { Alert, Toggle, Field } from '../../components';

const PMSignatureField = ({ id }) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updatePMSignature);
    const [{ PMSignature }] = useMailSettings();
    const { state, toggle } = useToggle(!!PMSignature);
    const isMandatory = PMSignature === 2;

    const handleChange = async ({ target }) => {
        await request(+target.checked);
        call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    if (isMandatory) {
        return (
            <Field>
                <div
                    className="bordered-container pl1 pr1 pt0-5 pb0-5 mb1"
                    dangerouslySetInnerHTML={{ __html: PM_SIGNATURE }}
                />
                <Alert>{c('Info')
                    .t`A paid plan is required to turn off the ProtonMail signature. Paid plan revenue allows us to continue supporting free accounts.`}</Alert>
            </Field>
        );
    }

    return (
        <>
            <Field>
                <div
                    className="bordered-container pl1 pr1 pt0-5 pb0-5 mb1"
                    dangerouslySetInnerHTML={{ __html: PM_SIGNATURE }}
                />
            </Field>
            <div className="ml1 onmobile-ml0">
                <Toggle loading={loading} id={id} checked={state} onChange={handleChange} />
            </div>
        </>
    );
};

PMSignatureField.propTypes = {
    id: PropTypes.string.isRequired,
};

export default PMSignatureField;

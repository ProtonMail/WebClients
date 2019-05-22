import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Alert,
    Toggle,
    useMailSettings,
    useToggle,
    useNotifications,
    useEventManager,
    useApiWithoutResult
} from 'react-components';
import { PM_SIGNATURE } from 'proton-shared/lib/constants';
import { updatePMSignature } from 'proton-shared/lib/api/mailSettings';

const PMSignatureToggle = ({ id }) => {
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
            <>
                <div className="bordered-container p1 mb1" dangerouslySetInnerHTML={{ __html: PM_SIGNATURE }} />
                <Alert>{c('Info')
                    .t`A paid plan is required to turn off the ProtonMail signature. Paid plan revenue allows us to continue supporting free accounts.`}</Alert>
            </>
        );
    }

    return (
        <>
            <div className="bordered-container p1 mb1" dangerouslySetInnerHTML={{ __html: PM_SIGNATURE }} />
            <Toggle loading={loading} id={id} checked={state} onChange={handleChange} />
        </>
    );
};

PMSignatureToggle.propTypes = {
    id: PropTypes.string.isRequired
};

export default PMSignatureToggle;

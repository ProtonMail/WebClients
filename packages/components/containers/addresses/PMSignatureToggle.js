import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, Toggle, useMailSettings, useToggle, useApiWithoutResult } from 'react-components';
import { PM_SIGNATURE } from 'proton-shared/lib/constants';
import { updatePMSignature } from 'proton-shared/lib/api/mailSettings';

const PMSignatureToggle = ({ id }) => {
    const { request, loading } = useApiWithoutResult(updatePMSignature);
    const [{ PMSignature }] = useMailSettings();
    const { state, toggle } = useToggle(!!PMSignature);
    const isMandatory = PMSignature === 2;

    const handleChange = async ({ target }) => {
        await request(+target.checked);
        toggle();
    };

    if (isMandatory) {
        return (
            <>
                <span dangerouslySetInnerHTML={{ __html: <div>{PM_SIGNATURE}</div> }} />
                <Alert>{c('Info')
                    .t`A paid plan is required to turn off the ProtonMail signature. Paid plan revenue allows us to continue supporting free accounts.`}</Alert>
            </>
        );
    }

    return (
        <>
            <Toggle disabled={loading} id={id} checked={state} onChange={handleChange} />
            <span dangerouslySetInnerHTML={{ __html: PM_SIGNATURE }} />
        </>
    );
};

PMSignatureToggle.propTypes = {
    id: PropTypes.string.isRequired
};

export default PMSignatureToggle;

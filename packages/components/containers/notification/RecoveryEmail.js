import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { PrimaryButton, Field } from '../../components';

const RecoveryEmail = ({ email, onClick }) => {
    return (
        <>
            <Field>
                <div className="ellipsis" title={email}>
                    {email || c('Info').t`Not set`}
                </div>
            </Field>
            <div className="ml1 onmobile-ml0">
                <PrimaryButton onClick={onClick}>{c('Action').t`Edit`}</PrimaryButton>
            </div>
        </>
    );
};

RecoveryEmail.propTypes = {
    email: PropTypes.string,
    onClick: PropTypes.func.isRequired,
};

export default RecoveryEmail;

import React from 'react';
import { c } from 'ttag';
import { PrimaryButton, Field } from 'react-components';
import PropTypes from 'prop-types';

const RecoveryEmail = ({ email, onClick }) => {
    return (
        <>
            <Field>
                <div className="ellipsis" title={email}>
                    {email}
                </div>
            </Field>
            <div className="ml1">
                <PrimaryButton onClick={onClick}>{c('Action').t`Edit`}</PrimaryButton>
            </div>
        </>
    );
};

RecoveryEmail.propTypes = {
    email: PropTypes.string,
    onClick: PropTypes.func.isRequired
};

export default RecoveryEmail;

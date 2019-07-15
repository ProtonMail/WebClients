import React from 'react';
import { c } from 'ttag';
import { PrimaryButton } from 'react-components';
import PropTypes from 'prop-types';

const RecoveryEmail = ({ email, onClick }) => {
    return (
        <div className="w100">
            <span className="mr0-5">{email}</span>
            <PrimaryButton onClick={onClick}>{c('Action').t`Edit`}</PrimaryButton>
        </div>
    );
};

RecoveryEmail.propTypes = {
    email: PropTypes.string,
    onClick: PropTypes.func.isRequired
};

export default RecoveryEmail;

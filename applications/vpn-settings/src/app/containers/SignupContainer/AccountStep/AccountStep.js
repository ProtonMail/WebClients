import React from 'react';
import PropTypes from 'prop-types';
import AccountForm from './AccountForm';
import { Row, SubTitle, useModals } from 'react-components';
import { c } from 'ttag';
import { hasProtonDomain } from 'proton-shared/lib/helpers/string';

import LoginPromptModal from './LoginPromptModal';
import LoginPanel from '../LoginPanel';

const AccountStep = ({ onContinue, model, children }) => {
    const { createModal } = useModals();

    const handleSubmit = ({ email, username, password }) => {
        if (hasProtonDomain(email)) {
            createModal(<LoginPromptModal email={email} />);
        } else {
            onContinue({ ...model, email, username, password });
        }
    };

    return (
        <div className="pt2 mb2">
            <SubTitle>{c('Title').t`Create an account`}</SubTitle>
            <Row>
                <div>
                    <AccountForm model={model} onSubmit={handleSubmit} />
                    <LoginPanel />
                </div>
                {children}
            </Row>
        </div>
    );
};

AccountStep.propTypes = {
    model: PropTypes.object.isRequired,
    onContinue: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default AccountStep;

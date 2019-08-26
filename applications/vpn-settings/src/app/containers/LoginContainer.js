import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { LoginContainer as LoginFormContainer, SimpleDropdown, DropdownMenu, Tooltip } from 'react-components';

import SignInLayout from '../components/layout/SignInLayout';

const LoginContainer = ({ onLogin }) => {
    return (
        <SignInLayout title={c('Title').t`Log in`}>
            <LoginFormContainer
                needHelp={
                    <Tooltip
                        title={c('Title')
                            .t`Make sure you log in with your Proton account. This is the Proton username and password you selected when you signed up for ProtonVPN, or your ProtonMail login credentials. You cannot use your OpenVPN credentials to log in.`}
                    >
                        <SimpleDropdown content={c('Dropdown button').t`Need help?`} className="pm-button--link">
                            <DropdownMenu>
                                <div className="inbl w100 pt0-5 pb0-5 ellipsis">test</div>
                            </DropdownMenu>
                        </SimpleDropdown>
                    </Tooltip>
                }
                onLogin={onLogin}
            />
        </SignInLayout>
    );
};

LoginContainer.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default LoginContainer;

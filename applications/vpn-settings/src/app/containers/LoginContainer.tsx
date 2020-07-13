import React from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { MinimalLoginContainer, Href, SimpleDropdown, DropdownMenu, SignInLayout, OnLoginArgs } from 'react-components';
import { isMember } from 'proton-shared/lib/user/helpers';
import * as H from 'history';

interface Props {
    onLogin: (args: OnLoginArgs) => void;
    history: H.History;
    stopRedirect: () => void;
}

const LoginContainer = ({ stopRedirect, history, onLogin }: Props) => {
    return (
        <SignInLayout title={c('Title').t`Log in`}>
            <h2>{c('Title').t`User log in`}</h2>
            <MinimalLoginContainer
                onLogin={(...args) => {
                    stopRedirect();

                    const [{ User }] = args;

                    if (User && isMember(User)) {
                        history.push('/account');
                    } else {
                        history.push('/dashboard');
                    }

                    onLogin(...args);
                }}
                needHelp={
                    <SimpleDropdown content={c('Dropdown button').t`Need help?`} className="pm-button--link">
                        <DropdownMenu>
                            <ul className="unstyled mt0 mb0">
                                <li className="dropDown-item">
                                    <Link to="/reset-password" className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1">
                                        {c('Link').t`Reset password`}
                                    </Link>
                                </li>
                                <li className="dropDown-item">
                                    <Link to="/forgot-username" className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1">
                                        {c('Link').t`Forgot username?`}
                                    </Link>
                                </li>
                                <li className="dropDown-item">
                                    <Href
                                        url="https://protonvpn.com/support/login-problems/"
                                        className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1"
                                    >
                                        {c('Link').t`Common login problems`}
                                    </Href>
                                </li>
                                <li className="dropDown-item">
                                    <Href
                                        url="https://protonvpn.com/support/"
                                        className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1"
                                    >
                                        {c('Link').t`Contact support`}
                                    </Href>
                                </li>
                            </ul>
                        </DropdownMenu>
                    </SimpleDropdown>
                }
            />
        </SignInLayout>
    );
};

export default LoginContainer;

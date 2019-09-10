import React from 'react';
import { c } from 'ttag';
import { Link } from 'react-router-dom';

const LoginPanel = () => {
    return (
        <div className="border-top mt2 pt2">
            <h3 className="mb1">{c('Title').t`Already have a Proton account?`}</h3>
            <div className="mb1-5">{c('Info')
                .t`If you are a ProtonMail user you can use your Proton account to log in to ProtonVPN.`}</div>
            <div>
                <Link className="pm-button--primaryborder" to="/login">{c('Link').t`Log in`}</Link>
            </div>
        </div>
    );
};

export default LoginPanel;

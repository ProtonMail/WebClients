import React from 'react';
import { c } from 'ttag';
import { Link } from 'react-router-dom';
import { ButtonLike } from '@proton/components';

const LoginPanel = () => {
    return (
        <div className="border-top mt2 pt2">
            <h3 className="mb1">{c('Title').t`Already have a Proton account?`}</h3>
            <div className="mb1-5">{c('Info')
                .t`If you are a ProtonMail user you can use your Proton account to log in to ProtonVPN.`}</div>
            <div>
                <ButtonLike as={Link} shape="outline" color="norm" to="/login">{c('Link').t`Log in`}</ButtonLike>
            </div>
        </div>
    );
};

export default LoginPanel;

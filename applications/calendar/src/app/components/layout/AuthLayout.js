import React from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router';

import AuthHeader from './AuthHeader';
import AuthSidebar from './AuthSidebar';

const AuthLayout = ({ children }) => {
    return (
        <>
            <AuthHeader />
            <div className="flex flex-nowrap">
                <Route path="/:path" render={() => <AuthSidebar />} />
                <div className="main flex-item-fluid main-area">
                    <div className="flex flex-reverse">{children}</div>
                </div>
            </div>
        </>
    );
};

AuthLayout.propTypes = {
    children: PropTypes.node.isRequired
};

export default AuthLayout;

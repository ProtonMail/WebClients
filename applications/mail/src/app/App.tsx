import { hot } from 'react-hot-loader/root';
import React, { useState, Dispatch, SetStateAction } from 'react';
import { ProtonApp, useAuthentication } from 'react-components';

import * as config from './config';
import PrivateApp from './PrivateApp';
import PublicApp from './PublicApp';

import './app.scss';

interface Props {
    throughLogin: boolean;
    setThroughLogin: Dispatch<SetStateAction<boolean>>;
}

const Setup = ({ throughLogin, setThroughLogin }: Props) => {
    const { UID, login, logout } = useAuthentication();

    const handleLogin = (...args: any[]) => {
        setThroughLogin(true);
        return login(...args);
    };
    const handleLogout = (...args: any[]) => {
        setThroughLogin(false);
        return logout(...args);
    };

    if (UID) {
        return <PrivateApp throughLogin={throughLogin} onLogout={handleLogout} />;
    }
    return <PublicApp onLogin={handleLogin} />;
};

const App = () => {
    // The user is passed through the login step
    const [throughLogin, setThroughLogin] = useState(false);

    return (
        <ProtonApp config={config}>
            <Setup throughLogin={throughLogin} setThroughLogin={setThroughLogin} />
        </ProtonApp>
    );
};

export default hot(App);

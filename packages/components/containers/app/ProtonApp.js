import React, { useState, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router } from 'react-router-dom';
import createAuthentication from 'proton-shared/lib/authenticationStore';
import createCache from 'proton-shared/lib/helpers/cache';
import { formatUser, UserModel } from 'proton-shared/lib/models/userModel';
import { STATUS } from 'proton-shared/lib/models/cache';
import createSecureSessionStorage from 'proton-shared/lib/createSecureSessionStorage';
import { MAILBOX_PASSWORD_KEY, UID_KEY } from 'proton-shared/lib/constants';

import CompatibilityCheck from './CompatibilityCheck';
import Icons from '../../components/icon/Icons';
import useInstance from '../../hooks/useInstance';
import ConfigProvider from '../config/Provider';
import NotificationsProvider from '../notifications/Provider';
import ModalsProvider from '../modals/Provider';
import ApiProvider from '../api/ApiProvider';
import CacheProvider from '../cache/Provider';
import AuthenticationProvider from '../authentication/Provider';
import RightToLeftProvider from '../rightToLeft/Provider';

const ProtonApp = ({ config, children }) => {
    const authentication = useInstance(() =>
        createAuthentication(createSecureSessionStorage([MAILBOX_PASSWORD_KEY, UID_KEY]))
    );
    const cacheRef = useRef();
    const [UID, setUID] = useState(() => authentication.getUID());
    const tempDataRef = useRef({});

    if (!cacheRef.current) {
        cacheRef.current = createCache();
    }

    const handleLogin = useCallback(({ UID: newUID, EventID, keyPassword, User }) => {
        authentication.setUID(newUID);
        authentication.setPassword(keyPassword);

        cacheRef.current.reset();
        const cache = createCache();

        // If the user was received from the login call, pre-set it directly.
        User &&
            cache.set(UserModel.key, {
                value: formatUser(User),
                status: STATUS.RESOLVED
            });
        cache.set('tmp', { eventID: EventID });

        cacheRef.current = cache;

        setUID(newUID);
    }, []);

    const handleLogout = useCallback(() => {
        authentication.setUID();
        authentication.setPassword();

        tempDataRef.current = {};
        cacheRef.current.reset();
        cacheRef.current = createCache();

        setUID();
    }, []);

    const authenticationValue = useMemo(() => {
        if (!UID) {
            return {
                login: handleLogin
            };
        }
        return {
            UID,
            ...authentication,
            login: handleLogin,
            logout: handleLogout
        };
    }, [UID]);

    return (
        <ConfigProvider config={config}>
            <CompatibilityCheck>
                <Icons />
                <RightToLeftProvider>
                    <Router>
                        <React.Fragment key={UID}>
                            <NotificationsProvider>
                                <ModalsProvider>
                                    <ApiProvider UID={UID} config={config} onLogout={handleLogout}>
                                        <AuthenticationProvider store={authenticationValue}>
                                            <CacheProvider cache={cacheRef.current}>{children}</CacheProvider>
                                        </AuthenticationProvider>
                                    </ApiProvider>
                                </ModalsProvider>
                            </NotificationsProvider>
                        </React.Fragment>
                    </Router>
                </RightToLeftProvider>
            </CompatibilityCheck>
        </ConfigProvider>
    );
};

ProtonApp.propTypes = {
    config: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired
};

export default ProtonApp;

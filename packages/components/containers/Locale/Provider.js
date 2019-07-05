import { c } from 'ttag';
import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useUserSettings, useConfig, useNotifications } from 'react-components';
import { localeFactory } from 'proton-shared/lib/i18n';
import { DEFAULT_TRANSLATION } from 'proton-shared/lib/constants';

export const LocaleContext = createContext();

export const LocaleAuthProvider = ({ children }) => {
    const config = useConfig();
    const { createNotification } = useNotifications();
    const [{ Locale } = {}] = useUserSettings();
    const [state, setState] = useState(Locale);
    const loadLocale = localeFactory(config);

    // Load the translations when we load the app
    useEffect(() => {
        loadLocale(Locale).then(() => {
            state !== Locale && createNotification({ text: c('Success').t`Locale updated` });
            setState(Locale); // force refresh children
        });
    }, [Locale]);

    return <LocaleContext.Provider value={state}>{children}</LocaleContext.Provider>;
};

export const LocaleNonAuthProvider = ({ children }) => {
    const config = useConfig();
    const [state, setState] = useState(DEFAULT_TRANSLATION);
    const loadLocale = localeFactory(config);

    useEffect(() => {
        loadLocale().then(({ locale }) => {
            setState(locale); // force refresh children
        });
    }, []);

    return <LocaleContext.Provider value={state}>{children}</LocaleContext.Provider>;
};

LocaleAuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

LocaleNonAuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useLocale = () => useContext(LocaleContext);

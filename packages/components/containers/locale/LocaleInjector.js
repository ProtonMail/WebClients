import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadLocale, currentLocale, getBestMatch } from 'proton-shared/lib/i18n';
import { useUserSettings } from 'react-components';

/**
 * The purpose of this component is to load the locale for a user
 * when it's been changed in another tab.
 */
export const LocaleInjector = ({ locales, refresh }) => {
    const [{ Locale } = {}] = useUserSettings();

    useEffect(() => {
        // Already changed in the same window.
        if (currentLocale === getBestMatch(Locale, locales)) {
            return;
        }
        loadLocale(Locale, locales).then(refresh.current);
    }, [Locale]);

    return null;
};

LocaleInjector.propTypes = {
    locales: PropTypes.object.isRequired,
    refresh: PropTypes.object
};

export default LocaleInjector;

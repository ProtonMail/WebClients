import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';

import { selectLocale } from '@proton/pass/store/selectors';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import { loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { locales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

import { i18n } from '../../lib/i18n';
import { Lobby } from './Lobby';
import { Main } from './Main';

export const AuthSwitch: FC<{ loggedIn: boolean }> = ({ loggedIn }) => {
    const [locale, setLocale] = useState(DEFAULT_LOCALE);
    const nextLocale = useSelector(selectLocale);

    useEffect(() => {
        const defaultLocale = i18n.getLocale();

        void loadLocale(nextLocale ?? defaultLocale, locales)
            .then(() => setLocale(nextLocale ?? defaultLocale))
            .catch(noop);
    }, [nextLocale]);

    return <Route key={locale} path="*" render={() => (loggedIn ? <Main /> : <Lobby />)} />;
};

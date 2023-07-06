import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import {
    HumanVerificationForm,
    HumanVerificationSteps,
    StandardLoadErrorPage,
    useApi,
    useNotifications,
    useThemeQueryParameter,
} from '@proton/components';
import useInstance from '@proton/hooks/useInstance';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCheckVerificationCode } from '@proton/shared/lib/api/user';
import { getGenericErrorPayload } from '@proton/shared/lib/broadcast';
import { createOfflineError } from '@proton/shared/lib/fetch/ApiError';
import { getBrowserLocale, getClosestLocaleCode, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { getDarkThemes } from '@proton/shared/lib/themes/themes';

import broadcast, { MessageType } from './broadcast';
import locales from './locales';
import { VerificationSearchParameters } from './types';

import './Verify.scss';

setTtagLocales(locales);

const windowIsEmbedded = window.location !== window.parent.location;
const darkThemes = getDarkThemes();

const parseSearch = (search: string) =>
    Object.fromEntries(
        [...new URLSearchParams(search).entries()].map(([key, value]) => {
            if (key === 'methods') {
                return [key, value.split(',')];
            }
            return [key, value];
        })
    );

const Verify = () => {
    const [step, setStep] = useState(HumanVerificationSteps.ENTER_DESTINATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const api = useApi();
    const { createNotification } = useNotifications();
    const location = useLocation();
    const theme = useThemeQueryParameter();

    const search = parseSearch(location.search) as VerificationSearchParameters;
    const { methods, embed, locale, token, vpn, defaultCountry, defaultEmail, defaultPhone } = search;

    const isEmbedded = windowIsEmbedded || embed;

    const handleClose = () => {
        broadcast({ type: MessageType.CLOSE });
    };

    const handleLoaded = () => {
        broadcast({ type: MessageType.LOADED });
    };

    const handleError = (error: unknown) => {
        broadcast({ type: MessageType.ERROR, payload: getGenericErrorPayload(error) });
    };

    useEffect(() => {
        const browserLocale = getBrowserLocale();

        const localeCode = getClosestLocaleMatch(locale || '', locales) || getClosestLocaleCode(browserLocale, locales);

        Promise.all([loadLocale(localeCode, locales), loadDateLocale(localeCode, browserLocale)])
            .then(() => {
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
                handleError(createOfflineError({}));
                // Also sends out a loaded message for clients that don't handle the error message to display the error screen.
                handleLoaded();
            });

        if (!isEmbedded) {
            document.body.classList.remove('embedded');
        }

        if (vpn) {
            document.body.classList.add('vpn');
        }
    }, []);

    const sendHeight = (resizes: ResizeObserverEntry[]) => {
        const [entry] = resizes;

        broadcast({
            type: MessageType.RESIZE,
            payload: { height: entry.target.clientHeight },
        });
    };

    const resizeObserver = useInstance(() => new ResizeObserver(sendHeight));

    const registerRootRef = (el: HTMLElement) => {
        if (el && isEmbedded) {
            resizeObserver.observe(el);
        }
    };

    useEffect(
        () => () => {
            resizeObserver.disconnect();
        },
        []
    );

    const handleSubmit = async (token: string, type: HumanVerificationMethodType) => {
        if (type !== 'captcha' && type !== 'ownership-sms' && type !== 'ownership-email') {
            try {
                await api({ ...queryCheckVerificationCode(token, type, 1), silence: true });

                broadcast({
                    type: MessageType.HUMAN_VERIFICATION_SUCCESS,
                    payload: { token, type },
                });

                if (!isEmbedded) {
                    /*
                     * window.close() will only be allowed to execute should the current window
                     * have been opened programatically, otherwise the following error is thrown:
                     *
                     * "Scripts may close only the windows that were opened by it."
                     */
                    window.close();
                }
            } catch (e: any) {
                createNotification({
                    type: 'error',
                    text: getApiErrorMessage(e) || c('Error').t`Unknown error`,
                });

                throw e;
            }
        } else {
            broadcast({
                type: MessageType.HUMAN_VERIFICATION_SUCCESS,
                payload: { token, type },
            });
        }
    };

    const wrapInMain = (child: ReactNode) => (
        <main className="hv h100" ref={registerRootRef}>
            <div className="hv-container shadow-lifted shadow-color-primary on-tiny-mobile-no-box-shadow ui-standard relative no-scroll w100 max-w100 mx-auto mw30r">
                {child}
            </div>
        </main>
    );

    if (loading) {
        return null;
    }

    if (error) {
        return <StandardLoadErrorPage />;
    }

    if (methods === undefined) {
        return wrapInMain('You need to specify recovery methods');
    }

    if (token === undefined) {
        return wrapInMain('You need to specify a token');
    }

    const hv = (
        <HumanVerificationForm
            theme={theme && darkThemes.includes(theme) ? 'dark' : 'light'}
            step={step}
            onChangeStep={setStep}
            onSubmit={handleSubmit}
            onLoaded={handleLoaded}
            onClose={handleClose}
            onError={(e) => {
                setError(true);
                handleError(e);
                // Also sends out a loaded message for clients that don't handle the error message to display the error screen.
                handleLoaded();
            }}
            methods={methods}
            token={token}
            defaultCountry={defaultCountry}
            defaultEmail={defaultEmail}
            defaultPhone={defaultPhone}
            isEmbedded={isEmbedded}
        />
    );

    if (isEmbedded) {
        return (
            <main className="p-5" ref={registerRootRef}>
                {hv}
            </main>
        );
    }

    return wrapInMain(hv);
};

export default Verify;

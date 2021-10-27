import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { c } from 'ttag';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { queryCheckVerificationCode } from '@proton/shared/lib/api/user';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import {
    HumanVerificationForm,
    HumanVerificationSteps,
    useInstance,
    useTheme,
    useApi,
    useNotifications,
} from '@proton/components';

import broadcast, { MessageType } from './broadcast';
import { VerificationSearchParameters } from './types';
import './Verification.scss';

const windowIsEmbedded = window.location !== window.parent.location;

const parseSearch = (search: string) => Object.fromEntries(new URLSearchParams(search).entries());

const Verification = () => {
    const [step, setStep] = useState(HumanVerificationSteps.ENTER_DESTINATION);
    const [, setTheme] = useTheme();
    const api = useApi();
    const { createNotification } = useNotifications();
    const location = useLocation();

    const search = parseSearch(location.search) as VerificationSearchParameters;

    const { methods, embed, theme, token, defaultCountry, defaultEmail, defaultPhone } = search;

    const isEmbedded = windowIsEmbedded || embed;

    useEffect(() => {
        if (theme) {
            setTheme(Number(theme));
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
        if (type !== 'captcha') {
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
        <main className="hv h100 ui-standard" ref={registerRootRef}>
            <div className="hv-container color-norm bg-norm relative no-scroll w100 max-w100 center mw30r">{child}</div>
        </main>
    );

    if (methods === undefined) {
        return wrapInMain('You need to specify recovery methods');
    }

    if (token === undefined) {
        return wrapInMain('You need to specify a token');
    }

    const hv = (
        <HumanVerificationForm
            step={step}
            onChangeStep={setStep}
            onSubmit={handleSubmit}
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
            <main className="pl2 pr2" ref={registerRootRef}>
                {hv}
            </main>
        );
    }

    return wrapInMain(hv);
};

export default Verification;

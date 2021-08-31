import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';
import { HumanVerificationForm, HumanVerificationSteps, useInstance, useTheme } from '@proton/components';

import './Verification.scss';

interface VerificationSearchParameters {
    methods?: HumanVerificationMethodType[];
    embed?: boolean;
    theme?: ThemeTypes;
    token?: string;
    origin?: string;
    defaultCountry?: string;
    defaultEmail?: string;
    defaultPhone?: string;
}

const getClient = () => {
    const {
        navigator: { standalone, userAgent },
    } = (window as any).navigator.standalone;
    const lowercaseUserAgent = userAgent.toLowerCase();
    const safari = /safari/.test(lowercaseUserAgent);
    const ios = /iphone|ipod|ipad/.test(lowercaseUserAgent);

    if (ios) {
        if (!standalone && safari) {
            // browser
        } else if (standalone && !safari) {
            // standalone
        } else if (!standalone && !safari) {
            // uiwebview
            return 'ios';
        }
    }

    if (typeof (window as any).AndroidInterface !== 'undefined') {
        return 'android';
    }

    if ((window as any).chrome && (window as any).chrome.webview) {
        return 'webview';
    }

    return 'web';
};

const windowIsEmbedded = window.location !== window.parent.location;

const postMessage = windowIsEmbedded ? window.parent.postMessage : window.postMessage;

const replyToOrigin = (token: string, tokenType: HumanVerificationMethodType, origin: string) => {
    const client = getClient();

    switch (client) {
        case 'ios': {
            // window.location.href = 'recaptcha_response://' + response;
            break;
        }

        case 'android': {
            // (window as any).AndroidInterface.receiveResponse(response);
            break;
        }

        case 'webview': {
            // This is an embedded chrome browser. It uses different message passing mechanism.
            // (window as any).chrome.webview.postMessage(message);
            break;
        }

        case 'web': {
            postMessage(
                {
                    type: 'verification-success',
                    payload: { token, tokenType },
                },
                origin
            );
            break;
        }

        default:
    }
};

const parseSearch = (search: string) => Object.fromEntries(new URLSearchParams(search).entries());

const Verification = () => {
    const [step, setStep] = useState(HumanVerificationSteps.ENTER_DESTINATION);

    const location = useLocation();

    const search = parseSearch(location.search) as VerificationSearchParameters;

    const { methods, embed, theme, token, origin, defaultCountry, defaultEmail, defaultPhone } = search;

    const [, setTheme] = useTheme();

    useEffect(() => {
        if (theme) {
            setTheme(Number(theme));
        }
    }, []);

    const getOriginError = () => {
        return new Error('origin parameter missing');
    };
    const sendHeight = (resizes: ResizeObserverEntry[]) => {
        if (!origin) {
            throw getOriginError();
        }

        const [entry] = resizes;

        postMessage(
            {
                type: 'verification-height',
                height: entry.target.clientHeight,
            },
            origin
        );
    };

    const resizeObserver = useInstance(() => new ResizeObserver(sendHeight));

    const registerRootRef = (el: HTMLElement) => {
        if (windowIsEmbedded) {
            resizeObserver.observe(el);
        }
    };

    useEffect(
        () => () => {
            resizeObserver.disconnect();
        },
        []
    );

    const handleSubmit = (token: string, tokenType: HumanVerificationMethodType) => {
        if (!origin) {
            throw getOriginError();
        }

        replyToOrigin(token, tokenType, origin);

        if (!windowIsEmbedded) {
            /*
             * window.close() will only be allowed to execute should the current window
             * have been opened programatically, otherwise the following error is thrown:
             *
             * "Scripts may close only the windows that were opened by it."
             */
            window.close();
        }
    };

    const wrapInMain = (child: ReactNode) => (
        <main className="hv h100 ui-standard" ref={registerRootRef}>
            <div className="hv-container color-norm bg-norm relative no-scroll w100 max-w100 center mw30r">{child}</div>
        </main>
    );

    if (!methods) {
        return wrapInMain('You need to specify recovery methods');
    }

    if (!token) {
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
        />
    );

    if (embed || windowIsEmbedded) {
        return <main ref={registerRootRef}>{hv}</main>;
    }

    return wrapInMain(hv);
};

export default Verification;

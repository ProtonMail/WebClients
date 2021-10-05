import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';
import { HumanVerificationForm, HumanVerificationSteps, useInstance, useTheme } from '@proton/components';

import broadcast, { MessageType } from './broadcast';

import './Verification.scss';

interface VerificationSearchParameters {
    methods?: HumanVerificationMethodType[];
    embed?: boolean;
    theme?: ThemeTypes;
    token?: string;
    defaultCountry?: string;
    defaultEmail?: string;
    defaultPhone?: string;
}

const windowIsEmbedded = window.location !== window.parent.location;

const parseSearch = (search: string) => Object.fromEntries(new URLSearchParams(search).entries());

const Verification = () => {
    const [step, setStep] = useState(HumanVerificationSteps.ENTER_DESTINATION);

    const location = useLocation();

    const search = parseSearch(location.search) as VerificationSearchParameters;

    const { methods, embed, theme, token, defaultCountry, defaultEmail, defaultPhone } = search;

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

        broadcast({
            type: MessageType.RESIZE,
            payload: { height: entry.target.clientHeight },
        });
    };

    const resizeObserver = useInstance(() => new ResizeObserver(sendHeight));

    const registerRootRef = (el: HTMLElement) => {
        if (el && windowIsEmbedded) {
            resizeObserver.observe(el);
        }
    };

    useEffect(
        () => () => {
            resizeObserver.disconnect();
        },
        []
    );

    const handleSubmit = (token: string, type: HumanVerificationMethodType) => {
        if (!origin) {
            throw getOriginError();
        }

        broadcast({
            type: MessageType.HUMAN_VERIFICATION_SUCCESS,
            payload: { token, type },
        });

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
            isEmbedded={windowIsEmbedded}
        />
    );

    if (embed || windowIsEmbedded) {
        return <main ref={registerRootRef}>{hv}</main>;
    }

    return wrapInMain(hv);
};

export default Verification;

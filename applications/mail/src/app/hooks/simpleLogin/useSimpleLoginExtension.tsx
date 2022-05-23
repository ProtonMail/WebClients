import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { useApi } from '@proton/components/hooks';
import { getSLAccountLinked } from '@proton/shared/lib/api/simpleLogin';
import { SIMPLE_LOGIN_TAGS } from '@proton/shared/lib/constants';
import { isEdge, isFirefox, isSafari } from '@proton/shared/lib/helpers/browser';

const { EXTENSION_INSTALLED_QUERY, EXTENSION_INSTALLED_RESPONSE } = SIMPLE_LOGIN_TAGS;

export const SimpleLoginExtensionContext = createContext<{
    canUseExtension?: boolean;
    hasSLExtension?: boolean;
    hasAccountLinked?: boolean;
    hasSimpleLogin?: boolean;
    isFetchingAccountLinked?: boolean;
}>({});

export const useSimpleLoginExtension = () => {
    const { canUseExtension, hasSLExtension, hasAccountLinked, hasSimpleLogin, isFetchingAccountLinked } = useContext(
        SimpleLoginExtensionContext
    ) || {
        canUseExtension: undefined,
        hasSLExtension: undefined,
        hasAccountLinked: undefined,
        hasSimpleLogin: undefined,
        isFetchingAccountLinked: undefined,
    };

    return { canUseExtension, hasSLExtension, hasAccountLinked, hasSimpleLogin, isFetchingAccountLinked };
};

export const SimpleLoginExtensionProvider = ({ children }: { children: ReactNode }) => {
    const api = useApi();

    const [hasSLExtension, setHasSLExtension] = useState(false);
    const [hasAccountLinked, setHasAccountLinked] = useState(false);
    const [isFetchingAccountLinked, setIsFetchingAccountLinked] = useState(false);
    const [maxRetriesReached, setMaxRetriesReached] = useState(false);
    const [numberOfTries, setNumberOfTries] = useState(1);
    const maxNumberOfTries = 5;

    const canUseExtension = isEdge() || 'chrome' in window || isFirefox();

    // We don't need to present SL feature to users
    // Having the extension on Firefox or Chromium browsers
    // Having a Proton account linked to SL on Safari
    const hasSimpleLogin = canUseExtension ? hasSLExtension : hasAccountLinked;

    const handleSLExtensionEvents = (event: any) => {
        if (event.source !== window) {
            return;
        }

        if (event?.data?.tag === EXTENSION_INSTALLED_RESPONSE) {
            setHasSLExtension(true);
        }
    };

    useEffect(() => {
        // Event listener responsible for catching the extension response
        window.addEventListener('message', handleSLExtensionEvents);

        return () => {
            window.removeEventListener('message', handleSLExtensionEvents);
        };
    }, []);

    // Send 5 events with 200ms interval to check whether the extension is installed
    // the extension might miss it, so we send it multiple times to be sure
    useEffect(() => {
        if (!canUseExtension || hasSLExtension || maxRetriesReached) {
            return;
        }

        const sendEvent = setInterval(() => {
            if (numberOfTries < maxNumberOfTries) {
                // post a message to the extension to know whether it's installed
                window.postMessage({ tag: EXTENSION_INSTALLED_QUERY }, '/');
                setNumberOfTries(numberOfTries + 1);
            } else {
                setTimeout(() => {
                    setMaxRetriesReached(true);
                }, 200);
                clearInterval(sendEvent);
            }
        }, 200);

        return () => clearInterval(sendEvent);
    }, [numberOfTries, hasSLExtension, maxRetriesReached]);

    // If using Safari, the user cannot have an extension. However, he might have activated its SL account
    useEffect(() => {
        const handleGetSLAccountLinked = async () => {
            setIsFetchingAccountLinked(true);
            const { User } = await api(getSLAccountLinked());
            setIsFetchingAccountLinked(false);

            if (!!User) {
                setHasAccountLinked(true);
            }
        };

        if (isSafari()) {
            void handleGetSLAccountLinked();
        }
    }, []);

    return (
        <SimpleLoginExtensionContext.Provider
            value={{ canUseExtension, hasSLExtension, hasAccountLinked, hasSimpleLogin, isFetchingAccountLinked }}
        >
            {children}
        </SimpleLoginExtensionContext.Provider>
    );
};

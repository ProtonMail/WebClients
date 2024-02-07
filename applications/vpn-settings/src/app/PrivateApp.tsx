import { FunctionComponent, useState } from 'react';

import FlagProvider from '@unleash/proxy-client-react';

import {
    AccountSpotlightsProvider,
    ErrorBoundary,
    EventManagerProvider,
    LoaderPage,
    StandardErrorPage,
    StandardLoadErrorPage,
} from '@proton/components';
import StandardPrivateApp from '@proton/components/containers/app/StandardPrivateApp';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import { bootstrapApp } from './bootstrap';
import type { AccountStore } from './store/store';
import { extraThunkArguments } from './store/thunk';

interface Props {
    locales: TtagLocaleMap;
    store: AccountStore;
}

const defaultState: {
    MainContainer?: FunctionComponent;
    error?: { message: string } | undefined;
} = {
    error: undefined,
};

const PrivateApp = ({ store, locales }: Props) => {
    const [state, setState] = useState(defaultState);

    useEffectOnce(() => {
        (async () => {
            try {
                const result = await bootstrapApp({ store, locales });
                setState({ MainContainer: result.MainContainer });
            } catch (error: any) {
                setState({
                    error: {
                        message: getNonEmptyErrorMessage(error),
                    },
                });
            }
        })();
    });

    if (state.error) {
        return <StandardLoadErrorPage errorMessage={state.error.message} />;
    }

    if (!state.MainContainer) {
        return <LoaderPage />;
    }

    return (
        <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
            <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                <ErrorBoundary big component={<StandardErrorPage big />}>
                    <StandardPrivateApp>
                        <AccountSpotlightsProvider>
                            <state.MainContainer />
                        </AccountSpotlightsProvider>
                    </StandardPrivateApp>
                </ErrorBoundary>
            </EventManagerProvider>
        </FlagProvider>
    );
};

export default PrivateApp;

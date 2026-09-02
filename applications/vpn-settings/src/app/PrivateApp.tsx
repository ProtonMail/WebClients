import type { FunctionComponent } from 'react';
import { useState } from 'react';

import { AccountSpotlightsProvider } from '@proton/components/containers/account/spotlights/AccountSpotlightsProvider';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import StandardPrivateApp from '@proton/components/containers/app/StandardPrivateApp';
import EventManagerProvider from '@proton/components/containers/eventManager/EventManagerProvider';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { UnleashFlagProviderWithToolbar } from '@proton/unleash/UnleashFlagProviderWithToolbar';

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
        void (async () => {
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

    const loader = <LoaderPage />;
    if (!state.MainContainer) {
        return loader;
    }

    return (
        <UnleashFlagProviderWithToolbar unleashClient={extraThunkArguments.unleashClient}>
            <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                <ErrorBoundary big component={<StandardErrorPage big />}>
                    <StandardPrivateApp>
                        <AccountSpotlightsProvider>
                            <state.MainContainer />
                        </AccountSpotlightsProvider>
                    </StandardPrivateApp>
                </ErrorBoundary>
            </EventManagerProvider>
        </UnleashFlagProviderWithToolbar>
    );
};

export default PrivateApp;

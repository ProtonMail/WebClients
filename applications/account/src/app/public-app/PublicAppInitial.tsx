import { Suspense, lazy, useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';

import AccountLoaderPage from '../AccountLoaderPage';
import { PublicAppContext } from './state-machine/PublicAppContext';
import { forkPaths } from './state-machine/publicAppStateMachine';

const LazyPublicApp = lazy(
    () =>
        import(
            /* webpackChunkName: "PublicAppInteractive" */
            /* webpackPrefetch: true */
            /* webpackPreload: true */
            /* webpackFetchPriority: "high" */
            './PublicAppInteractive'
        )
);

/** Renders the fork routes' loader at once, and loads the rest of the public app. */
export const PublicAppInitial = () => {
    const actorRef = PublicAppContext.useActorRef();
    const errorMessage = PublicAppContext.useSelector((state) => state.context.errorMessage);
    const errorHandler = useErrorHandler();

    // A login with no caller waiting for it (a consent screen, the account switcher) shows its errors here
    useEffect(() => {
        const subscription = actorRef.on('login.failed', ({ requestId, error }) => {
            if (requestId === undefined) {
                errorHandler(error);
            }
        });
        return () => subscription.unsubscribe();
    }, [actorRef, errorHandler]);

    const loader = <AccountLoaderPage />;

    return (
        <Switch>
            <Route path={forkPaths} exact>
                {errorMessage === undefined ? loader : <StandardLoadErrorPage errorMessage={errorMessage} />}
            </Route>
            <Route path="*">
                <Suspense fallback={loader}>
                    <LazyPublicApp />
                </Suspense>
            </Route>
        </Switch>
    );
};

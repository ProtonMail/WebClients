import { flushSync } from 'react-dom';

import type * as H from 'history';

import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { stripLocaleTagPrefix } from '../../locales';
import type { SignInLocationState } from '../../sign-in/SignInContainer';
import type { LoginResult } from '../actions/interface';
import { forkPaths } from './publicAppStateMachine';

// Runs after the machine publishes its new state (xstate runs actions before it notifies subscribers), and renders that
// state and the new location together: the routes depend on both, and either one alone can hit the fallback redirect
const navigate = (to: () => void) => queueMicrotask(() => flushSync(to));

/** The public app machine's navigation, on the router's history. */
export const createPublicAppNavigation = (history: H.History) => ({
    followLoginResult: (_: unknown, { result }: { result: LoginResult }) => {
        if (result.type === 'done') {
            replaceUrl(result.payload.url.toString());
            return;
        }
        const location = result.location;
        if (location) {
            navigate(() => {
                // The fork only runs when the page opens, so going back to its URL would load forever
                if (forkPaths.includes(stripLocaleTagPrefix(history.location.pathname).pathname)) {
                    history.replace(location);
                } else {
                    history.push(location);
                }
            });
        }
    },
    replaceLocation: (_: unknown, { path, state }: { path: string; state?: SignInLocationState }) =>
        navigate(() => history.replace(path, state)),
});

import type { FC } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { useLobbyConnectivityBar } from '@proton/pass/components/Core/ConnectivityProvider';
import { clientBusy } from '@proton/pass/lib/client';

import { CreatePassword } from './CreatePassword';
import { CreateReport } from './CreateReport';
import { CreateService } from './CreateService';
import { ImportExport } from './ImportExport';
import { ImportProviders } from './ImportProviders';
import { ImportReport } from './ImportReport';
import { ImportUpload } from './ImportUpload';
import { Intro } from './Intro';

export const NEW_ACCOUNT_PATHS = ['/new-account', '/import', '/create'];

/** Escapes the new account flow to the thank-you page whenever the
 * session is lost (eg: logout or lock). Waits out a booting worker
 * (eg: tab reloaded after a worker restart) instead of escaping. */
export const NewAccountRoutes: FC<{ ready: boolean }> = ({ ready }) => {
    const { authorized, status } = useAppState();
    const connectivityBar = useLobbyConnectivityBar();

    if (!ready || clientBusy(status)) return null;
    if (!authorized) return <Redirect to="/thank-you" />;

    return (
        <>
            <Switch>
                <Route path="/new-account">
                    <Intro />
                </Route>
                <Route path="/import/report">
                    <ImportReport />
                </Route>
                <Route path="/import/:provider/upload">
                    <ImportUpload />
                </Route>
                <Route path="/import/:provider">
                    <ImportExport />
                </Route>
                <Route path="/import">
                    <ImportProviders />
                </Route>
                <Route path="/create/report">
                    <CreateReport />
                </Route>
                <Route path="/create/password">
                    <CreatePassword />
                </Route>
                <Route path="/create">
                    <CreateService />
                </Route>
            </Switch>
            {connectivityBar}
        </>
    );
};

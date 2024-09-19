import type { FC } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';

import { SettingsTabs } from './SettingsTabs';

export const SettingsRouter: FC = () => (
    <div
        className="pass-settings flex flex-column ui-standard w-full p-4 mx-auto bg-weak min-h-custom"
        style={{ '--min-h-custom': '100vh' }}
    >
        <HashRouter>
            <Switch>
                <Route
                    exact
                    path="/logs"
                    render={() => (
                        <div className="max-h-full max-w-full">
                            <ApplicationLogs opened style={{ '--h-custom': 'max(calc(100vh - 130px), 18.75rem)' }} />
                        </div>
                    )}
                />
                <Route render={({ location: { pathname } }) => <SettingsTabs pathname={pathname} />} />
            </Switch>
        </HashRouter>
    </div>
);

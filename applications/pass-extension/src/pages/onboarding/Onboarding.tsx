import type { VFC } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader';

import { ExtensionWindow } from '../../shared/components/extension';
import { InstallationSuccess } from './views/InstallationSuccess';
import { LoginSuccess } from './views/LoginSuccess';
import { ResumeSession } from './views/ResumeSession';

import './Onboarding.scss';

export const Onboarding: VFC = () => (
    <ExtensionWindow endpoint="page">
        {(ready) =>
            ready ? (
                <HashRouter>
                    <Switch>
                        <Route path="/resume">
                            <ResumeSession />
                        </Route>
                        <Route path="/success">
                            <InstallationSuccess />
                        </Route>
                        {/* TODO remove this once the onboarding page is integrated in the flow */}
                        <Route path="/todo_temporary_page">
                            <LoginSuccess />
                        </Route>
                    </Switch>
                </HashRouter>
            ) : (
                <CircleLoader />
            )
        }
    </ExtensionWindow>
);

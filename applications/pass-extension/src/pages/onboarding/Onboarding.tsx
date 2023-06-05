import type { VFC } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader';

import { ExtensionWindow } from '../../shared/components/extension';
import { InstallationSuccess } from './views/InstallationSuccess';
import { ResumeSession } from './views/ResumeSession';
import { Welcome } from './views/Welcome';

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
                        <Route path="/welcome">
                            <Welcome />
                        </Route>
                    </Switch>
                </HashRouter>
            ) : (
                <CircleLoader />
            )
        }
    </ExtensionWindow>
);

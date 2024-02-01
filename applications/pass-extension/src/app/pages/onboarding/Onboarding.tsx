import { type FC } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { ExtensionApp } from 'proton-pass-extension/lib/components/Extension/ExtensionApp';

import { Localized } from '@proton/pass/components/Core/Localized';

import { InstallationSuccess } from './Views/InstallationSuccess';
import { ResumeSession } from './Views/ResumeSession';
import { Welcome } from './Views/Welcome';

import './Onboarding.scss';

export const Onboarding: FC = () => (
    <ExtensionApp endpoint="page">
        {(ready) =>
            ready && (
                <Localized>
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
                </Localized>
            )
        }
    </ExtensionApp>
);

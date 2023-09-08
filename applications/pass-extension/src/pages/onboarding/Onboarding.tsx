import { Fragment, type VFC } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { ExtensionApp } from '../../shared/components/extension';
import { InstallationSuccess } from './views/InstallationSuccess';
import { ResumeSession } from './views/ResumeSession';
import { Welcome } from './views/Welcome';

import './Onboarding.scss';

export const Onboarding: VFC = () => (
    <ExtensionApp endpoint="page">
        {(ready, locale) =>
            ready && (
                <Fragment key={locale}>
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
                </Fragment>
            )
        }
    </ExtensionApp>
);

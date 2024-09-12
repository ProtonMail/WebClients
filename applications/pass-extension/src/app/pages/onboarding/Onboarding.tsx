import { type FC } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { Localized } from '@proton/pass/components/Core/Localized';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';

import { InstallationSuccess } from './Views/InstallationSuccess';
import { ResumeSession } from './Views/ResumeSession';
import { Welcome } from './Views/Welcome';

import './Onboarding.scss';

export const Onboarding: FC = () => (
    <ThemeProvider theme={PASS_DEFAULT_THEME}>
        <Localized>
            <HashRouter>
                <Switch>
                    {ENV === 'development' && (
                        <Route path="/resume">
                            <ResumeSession />
                        </Route>
                    )}
                    <Route path="/success">
                        <InstallationSuccess />
                    </Route>
                    <Route path="/welcome">
                        <Welcome />
                    </Route>
                </Switch>
            </HashRouter>
        </Localized>
    </ThemeProvider>
);

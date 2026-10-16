import type { FC } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { Localized } from '@proton/pass/components/Core/Localized';

import { ExtensionClient } from '../../../lib/components/Extension/ExtensionClient';
import { ExtensionStore } from '../../../lib/components/Extension/ExtensionStore';
import { usePageNotificationHandler } from '../../../lib/hooks/usePageNotificationHandler';
import { CreateProvider } from './Views/NewAccount/CreateProvider';
import { NEW_ACCOUNT_PATHS, NewAccountRoutes } from './Views/NewAccount/NewAccountRoutes';
import { ResumeSession } from './Views/ResumeSession';
import { ThankYou } from './Views/ThankYou';
import { Welcome } from './Views/Welcome';

import './Onboarding.scss';

export const Onboarding: FC = () => {
    const handleWorkerMessage = usePageNotificationHandler();

    return (
        <ExtensionStore>
            <ExtensionClient onWorkerMessage={handleWorkerMessage}>
                {(ready) => (
                    <Localized>
                        <CreateProvider>
                            <HashRouter>
                                <Switch>
                                    {ENV === 'development' && (
                                        <Route path="/resume">
                                            <ResumeSession />
                                        </Route>
                                    )}
                                    <Route path="/welcome">
                                        <Welcome />
                                    </Route>
                                    <Route path="/thank-you">
                                        <ThankYou />
                                    </Route>
                                    <Route path={NEW_ACCOUNT_PATHS}>
                                        <NewAccountRoutes ready={ready} />
                                    </Route>
                                </Switch>
                            </HashRouter>
                        </CreateProvider>
                    </Localized>
                )}
            </ExtensionClient>
        </ExtensionStore>
    );
};

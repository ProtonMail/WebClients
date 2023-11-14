import { Route, Switch } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage } from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { PrivateWalletLayout } from '../components';
import { DashboardContainer } from './DashboardContainer';

const MainContainer = () => {
    // TODO: we may need to init redux here

    return (
        <ErrorBoundary component={<StandardErrorPage big />}>
            <QuickSettingsRemindersProvider>
                <PrivateWalletLayout>
                    <Switch>
                        <Route path={'*'}>
                            <DashboardContainer />
                        </Route>
                    </Switch>
                </PrivateWalletLayout>
            </QuickSettingsRemindersProvider>
        </ErrorBoundary>
    );
};

export default MainContainer;
